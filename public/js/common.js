// カメラが拠点の周りを一周するのにかける時間（秒）
const rotational_speed = 120;

// カメラの位置・向きに関する設定 ----------------------
// カメラ高度(高さ)
const camera_altitude = 50;
// カメラの撮影範囲(fov?)
const camera_range = 800;
// チルト 傾き
const camera_tilt = 65;
// カメラ向き
const camera_heading = 0;
// -----------

// マーカーピンを地面からどれだけ浮かせて立てるか（メートル）
const marker_altitude = 60;

// 拠点間矢印に関する設定 ----------------------
// 矢印(線・矢先)を地面からどれだけ浮かせるか（メートル）
const arrow_altitude = 55;
// 矢先(三角形)の長さ・半幅（メートル）
const arrow_head_length_m = 100;
// const arrow_head_half_width_m = 20;
// 矢印の色
const arrow_color = "#55F";
// -----------

// 拠点間矢印の表示モード: "off"(非表示) → "adjacent"(前後のみ) → "all"(すべて表示) の順に切り替える
let arrow_mode = "off";
const arrow_mode_order = ["off", "adjacent", "all"];
const arrow_mode_labels = {
    off: "矢印: 非表示",
    adjacent: "矢印: 前後の拠点のみ",
    all: "矢印: すべての拠点を表示",
};
// 生成済みの矢印要素（線・矢先）を地図から取り除けるよう保持しておく
let arrow_elements = [];

// 表示対象となる拠点の座標一覧（date/Locations.json から読み込む）
// 形式: { キー: { name: 表示名, des: 説明文, photo: サムネイル画像パス, pos: [lat, lng] } }
let locations = {};

async function load_locations() {
    const response = await fetch("public/date/Locations.json");
    locations = await response.json();
}

// 現在表示中の拠点のキーを保持する変数（前後移動ボタンで参照する）
let current_location_key = null;

// 現在表示中の3D地図要素（<gmp-map-3d> 相当）を保持する変数
let map = null;

// 指定した拠点(location_key)を中心としたカメラ設定を作る
function build_camera(location_key) {
    const [lat, lng] = locations[location_key].pos;
    return {
        center: { lat, lng, altitude: camera_altitude },
        range: camera_range,
        tilt: camera_tilt,
        heading: camera_heading,
    };
}

// 緯度経度計算用のヘルパー ----------------------
const EARTH_RADIUS_M = 6371000;
const to_rad = (deg) => (deg * Math.PI) / 180;
const to_deg = (rad) => (rad * 180) / Math.PI;

// 2点間の初期方位角（度、北=0、時計回り）を求める
function compute_bearing(lat1, lng1, lat2, lng2) {
    const phi1 = to_rad(lat1);
    const phi2 = to_rad(lat2);
    const delta_lambda = to_rad(lng2 - lng1);
    const y = Math.sin(delta_lambda) * Math.cos(phi2);
    const x =
        Math.cos(phi1) * Math.sin(phi2) -
        Math.sin(phi1) * Math.cos(phi2) * Math.cos(delta_lambda);
    return (to_deg(Math.atan2(y, x)) + 360) % 360;
}

// 2点間の距離（メートル）を求める
function compute_distance_m(lat1, lng1, lat2, lng2) {
    const phi1 = to_rad(lat1);
    const phi2 = to_rad(lat2);
    const delta_phi = to_rad(lat2 - lat1);
    const delta_lambda = to_rad(lng2 - lng1);
    const a =
        Math.sin(delta_phi / 2) ** 2 +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(delta_lambda / 2) ** 2;
    return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 指定した地点から、方位角(bearing_deg)方向に距離(distance_m)だけ進んだ先の座標を求める
function offset_latlng(lat, lng, bearing_deg, distance_m) {
    const phi1 = to_rad(lat);
    const lambda1 = to_rad(lng);
    const theta = to_rad(bearing_deg);
    const delta = distance_m / EARTH_RADIUS_M;

    const phi2 = Math.asin(
        Math.sin(phi1) * Math.cos(delta) +
        Math.cos(phi1) * Math.sin(delta) * Math.cos(theta)
    );
    const lambda2 =
        lambda1 +
        Math.atan2(
            Math.sin(theta) * Math.sin(delta) * Math.cos(phi1),
            Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2)
        );

    return [to_deg(phi2), ((to_deg(lambda2) + 540) % 360) - 180];
}
// -----------

// from_key から to_key への矢印（線＋矢先の三角形）を1本生成し、地図に追加する
// SVGアイコンではなく実座標のジオメトリで矢先を作ることで、
// flyCameraAroundによるカメラの回転中も向きがずれずに表示される
function create_arrow(from_key, to_key, maps_library) {
    const { Polyline3DElement, Polygon3DElement } = maps_library;
    const [from_lat, from_lng] = locations[from_key].pos;
    const [to_lat, to_lng] = locations[to_key].pos;

    const bearing = compute_bearing(from_lat, from_lng, to_lat, to_lng);
    const distance = compute_distance_m(from_lat, from_lng, to_lat, to_lng);

    // 2拠点が近い場合は矢先が線からはみ出さないよう長さを距離の半分までに抑える
    const head_length = Math.min(arrow_head_length_m, distance / 2);
    console.log ("head_length:" + head_length)
    console.log ("arrow_head_length_m:" + arrow_head_length_m)
    // arrow_head_half_width_m = Math.min(arrow_head_length_m, head_length);
    console.log ("arrow_head_length_m:" + arrow_head_length_m)

    const [base_lat, base_lng] = offset_latlng(to_lat, to_lng, bearing + 180, head_length);
    const [left_lat, left_lng] = offset_latlng(base_lat, base_lng, bearing - 90, head_length/4);
    const [right_lat, right_lng] = offset_latlng(base_lat, base_lng, bearing + 90, head_length/4);

    const at_altitude = (lat, lng) => ({ lat, lng, altitude: arrow_altitude });

    const shaft = new Polyline3DElement({
        path: [at_altitude(from_lat, from_lng), at_altitude(base_lat, base_lng)],
        altitudeMode: "RELATIVE_TO_GROUND",
        strokeColor: arrow_color,
        strokeWidth: 4,
    });

    const head = new Polygon3DElement({
        path: [at_altitude(to_lat, to_lng), at_altitude(left_lat, left_lng), at_altitude(right_lat, right_lng)],
        altitudeMode: "RELATIVE_TO_GROUND",
        fillColor: arrow_color,
        strokeColor: arrow_color,
        strokeWidth: 1,
    });

    map.appendChild(shaft);
    map.appendChild(head);
    arrow_elements.push(shaft, head);
}

// 生成済みの矢印要素をすべて地図から取り除く
function clear_arrows() {
    arrow_elements.forEach((element) => element.remove());
    arrow_elements = [];
}

// arrow_modeに応じて、拠点間の矢印を再生成する
function render_arrows(maps_library) {
    clear_arrows();
    if (!map || arrow_mode === "off") return;

    const location_keys = Object.keys(locations);
    if (location_keys.length < 2) return;

    if (arrow_mode === "all") {
        // 拠点一覧の並び順で全拠点を一周する矢印を表示する
        location_keys.forEach((key, index) => {
            const next_key = location_keys[(index + 1) % location_keys.length];
            create_arrow(key, next_key, maps_library);
        });
    } else if (arrow_mode === "adjacent" && current_location_key) {
        // 前後移動ボタン(< >)で移動する先（前の拠点・次の拠点）へのみ矢印を表示する
        const current_index = location_keys.indexOf(current_location_key);
        const prev_key = location_keys[(current_index - 1 + location_keys.length) % location_keys.length];
        const next_key = location_keys[(current_index + 1) % location_keys.length];
        create_arrow(prev_key, current_location_key, maps_library);
        create_arrow(current_location_key, next_key, maps_library);
    }
}

// 矢印の表示切り替えボタンを有効化する
function render_arrow_control(maps_library) {
    const arrow_mode_btn = $("#arrow_mode_btn");

    const update_label = () => {
        arrow_mode_btn.text(arrow_mode_labels[arrow_mode]);
    };
    update_label();

    arrow_mode_btn.on("click", () => {
        const current_index = arrow_mode_order.indexOf(arrow_mode);
        arrow_mode = arrow_mode_order[(current_index + 1) % arrow_mode_order.length];
        update_label();
        render_arrows(maps_library);
    });
}

// 画面上部の現在地名表示（#now_location_name）を更新する
function update_now_location_name(location_key) {
    const now_location_name = $("#now_location_name");
    const now_location_des = $("#location_des_text");
    const thumbnail_wrap = $("#location_thumbnail_wrap");
    const thumbnail = $("#location_thumbnail");
    const location = locations[location_key];

    now_location_name.text(location.name);
    now_location_des.text(location.des);

    // 画像がまだ用意されていない拠点は、読み込み失敗時にサムネイル欄ごと隠す
    thumbnail.on("load", () => {
        thumbnail_wrap.css("display", "block");
    });
    thumbnail.on("error", () => {
        thumbnail_wrap.css("display", "none");
    });
    thumbnail.attr("alt", location.name);
    thumbnail.attr("src", location.photo);
}

// #statistics に緯度経度(左詰め)と「現在ロケーション番号/ロケーション数」(右詰め)を表示する
function update_statistics(location_key) {
    const location_coords = $("#location_coords");
    const location_count = $("#location_count");
    const location_keys = Object.keys(locations);
    const current_index = location_keys.indexOf(location_key);
    const [lat, lng] = locations[location_key].pos;

    location_coords.text(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    location_count.text(`${current_index + 1} / ${location_keys.length}`);
}

// 3D地図本体と全拠点のマーカーを初回のみ生成する
// （拠点を切り替えるたびに地図を作り直すと、都度タイルの読み込みからやり直しになるため、
// 　地図要素とマーカーは使い回し、カメラだけを移動させる）
function ensure_map(maps_library) {
    if (map) return map;

    const { Map3DElement, Marker3DInteractiveElement, MapMode } = maps_library;
    const container = $("#map");
    const first_location_key = Object.keys(locations)[0];

    // 3D地図本体を新規作成する
    // mode: HYBRID = 航空写真に道路・地名などの情報を重ねた表示
    map = new Map3DElement({
        ...build_camera(first_location_key),
        mode: MapMode.HYBRID,
    });
    container.append(map);

    // 全拠点にクリック可能なマーカーを立てる
    // クリックすると select_location() が呼ばれ、右サイドバーがその拠点の情報に切り替わる
    Object.keys(locations).forEach((key) => {
        const [marker_lat, marker_lng] = locations[key].pos;
        const location_marker = new Marker3DInteractiveElement({
            position: { lat: marker_lat, lng: marker_lng, altitude: marker_altitude },
            altitudeMode: "RELATIVE_TO_GROUND",
            extruded: true,
            label: locations[key].name,
        });
        location_marker.addEventListener("gmp-click", () => {
            select_location(key, maps_library);
        });
        map.appendChild(location_marker);
    });

    // スクロール(ホイール)でズーム操作された場合、周回アニメーションが競合して
    // 反映されなくなるため、ユーザー操作を検知したらアニメーションを止める
    map.addEventListener("wheel", () => {
        map.stopCameraAnimation();
    });

    return map;
}

// 指定した拠点(location_key)にカメラを移動し、その周りを一周させる
function render_location(location_key, maps_library) {
    const camera = build_camera(location_key);

    update_now_location_name(location_key);
    update_statistics(location_key);

    ensure_map(maps_library);

    // 拠点を中心にカメラをゆっくり一周させる演出
    map.flyCameraAround({
        camera: camera,
        durationMillis: rotational_speed * 1000,
        repeatCount: 3,
    });
}

// 指定した拠点(location_key)を選択状態にし、ナビのハイライトと地図を更新する
function select_location(location_key, maps_library) {
    current_location_key = location_key;

    $("#nav_list .location_btn").each((_, item) => {
        const is_active = item.dataset.location === location_key;
        item.classList.toggle("active", is_active);
        // 前後移動ボタンで選ばれた場合など、対象がリスト表示外にあれば自動でスクロールする
        if (is_active) {
            item.scrollIntoView({ block: "start", behavior: "smooth" });
        }
    });

    render_location(location_key, maps_library);
    render_arrows(maps_library);
}

// locations の内容から拠点切り替えボタンを生成し、#nav (ul) に li として差し込む
// 拠点を追加・削除する際は date/Locations.json を編集するだけでよく、HTML側の修正は不要
function render_nav(maps_library) {
    const nav = $("#nav_list");
    nav.empty();

    Object.keys(locations).forEach((location_key) => {
        const location = locations[location_key];
        const button = document.createElement("button");
        button.type = "button";
        button.className = "location_btn";
        button.dataset.location = location_key;
        button.textContent = location.name;

        button.addEventListener("click", () => {
            select_location(location_key, maps_library);
        });

        const li = document.createElement("li");
        li.appendChild(button);
        nav.append(li);
    });
}

// 前後移動ボタン(< >)で拠点一覧を順番に巡回する
function render_step_buttons(maps_library) {
    const prev_button = $("#prev_location_btn");
    const next_button = $("#next_location_btn");

    const move = (offset) => {
        const location_keys = Object.keys(locations);
        const current_index = location_keys.indexOf(current_location_key);
        const next_index =
            (current_index + offset + location_keys.length) % location_keys.length;
        select_location(location_keys[next_index], maps_library);
    };

    prev_button.on("click", () => move(-1));
    next_button.on("click", () => move(1));
}

async function init_map() {
    // 地図を描画する土台となるDIV要素を取得する
    const container = $("#map");
    if (container.length === 0) return;

    try {
        // 拠点データ（date/Locations.json）を読み込む
        await load_locations();

        // Google Maps JavaScript APIの「maps3d」ライブラリを読み込む
        // Map3DElement: 3D地図本体のクラス
        // Marker3DInteractiveElement: 3D地図上に立てるクリック可能なマーカー（目印）のクラス
        // MapMode: 地図の表示モード（航空写真＋地図情報など）を指定するための定数集
        const maps_library = await google.maps.importLibrary("maps3d");

        // 拠点切り替えボタンを生成する
        render_nav(maps_library);

        // 前後移動ボタン(< >)を有効化する
        render_step_buttons(maps_library);

        // 拠点間矢印の表示切り替えボタンを有効化する
        render_arrow_control(maps_library);

        // 初期表示として先頭の拠点の地図を表示する
        const first_location_key = Object.keys(locations)[0];
        select_location(first_location_key, maps_library);
    } catch (error) {
        // ライブラリの読み込みや地図の初期化に失敗した場合のフォールバック表示
        container.html("3D map could not be initialized.");
        console.error(error);
    }
}

// index.html側の <script> 読み込み完了後に init_map が呼べるよう、グローバルに公開する
window.initMap = init_map;
// ページの読み込み完了（画像等も含む）を待ってから地図を初期化する
window.addEventListener("load", init_map);
