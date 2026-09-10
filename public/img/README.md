# public/img フォルダ

各拠点の写真を、`public/date/Locations.json` の `photo` に指定されたファイル名でこのフォルダに置く。
画像が無い拠点はサイドバーのサムネイル欄が自動的に非表示になる（`public/js/common.js` の `update_now_location_name` を参照）。

| ファイル名 | 拠点 | 入手元 |
|---|---|---|
| science_museum.jpg | 科学館 | Wikimedia Commons（[File:Nagoya_City_Science_Museum-March_2012.jpg](https://commons.wikimedia.org/wiki/File:Nagoya_City_Science_Museum-March_2012.jpg)、CC BY-SA、撮影: 名古屋太郎） |
| akanesu_meieki_ring.jpg | アカネス名駅前 - 手作りリング | 自分で撮影 |
| toriken.jpg | 鳥肉屋-鳥健 | 自分で撮影 |
| nikuno_marusan.jpg | 肉屋-肉のマルサン | 自分で撮影 |
| hotel_houwa_seminar_plaza.jpg | ホテル-邦和セミナープラザ | 自分で撮影 |
| nagoya_port_aquarium.jpg | 名古屋港水族館 | Wikimedia Commons（[File:Port_of_Nagoya_Public_Aquarium_Exterior_(1)...jpg](https://commons.wikimedia.org/wiki/File:Port_of_Nagoya_Public_Aquarium_Exterior_(1),_Minato-machi_Minato_Ward_Nagoya_2022.jpg)、CC BY-SA 4.0、撮影: Tomio344456） |

科学館・水族館の写真はWikimedia CommonsのCC BY-SAライセンス画像（学校提出用途）。CC BY-SAは再配布時にクレジット表記が必要なため、公開・配布する場合は上記のクレジットを明記すること。

拡張子が `.jpg` 以外（`.png` など）の場合は、`public/date/Locations.json` 側の `photo` の値も合わせて変更すること。
