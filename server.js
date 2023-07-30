const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const EventHubReader = require("./scripts/event-hub-reader.js");

var Client = require("azure-iothub").Client;
var Message = require("azure-iot-common").Message;
let lamp = true;
let water = true;
var datas = [];

// kết nối với mysql
// server.js
const mysql = require('mysql2');

// Tạo kết nối đến cơ sở dữ liệu (thay các thông tin kết nối của bạn vào dòng dưới)
const connection = mysql.createConnection({
  host: 'localhost', // Ví dụ: 'localhost'
  user: 'root',
  password: 'Vanduckun55442001',
  database: 'my-farm',
});

// Kết nối đến cơ sở dữ liệu và lấy dữ liệu
function connectAndFetchData() {
  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        console.error('Lỗi kết nối:', err);
        reject(err);
      }

      console.log('Đã kết nối đến cơ sở dữ liệu MySQL');
      // Bắt đầu thực hiện các thao tác với cơ sở dữ liệu ở đây
      // Thực hiện truy vấn SELECT để lấy dữ liệu từ bảng "devices"
      const query = 'SELECT * FROM devices';

      connection.query(query, (err, results, fields) => {
        if (err) {
          console.error('Lỗi truy vấn:', err);
          reject(err);
        }

        // Kết quả truy vấn sẽ được lưu trong biến "results"
        console.log(results);
        datas = results;

        // Đóng kết nối sau khi đã lấy dữ liệu
        connection.end();

        resolve(datas);
      });
    });
  });
}

// Kết nối đến cơ sở dữ liệu và lấy dữ liệu
connectAndFetchData()
  .then(() => {
    // Tiếp tục xử lý và sử dụng biến datas ở bất kỳ nơi nào trong đoạn mã sau này
    console.log("datas: ", datas);

    const iotHubConnectionString =
      "HostName=Arimaa-IoT-Hub.azure-devices.net;SharedAccessKeyName=service;SharedAccessKey=E5mpGHtp5qlZIsbSBG7d4YTvBuryf2Kya0VSbhuODoY=";
    if (!iotHubConnectionString) {
      console.error(
        `Environment variable IotHubConnectionString must be specified.`
      );
      return;
    }
    // console.log(`Using IoT Hub connection string [${iotHubConnectionString}]`);

    const eventHubConsumerGroup = "My-Farm";
    // console.log(eventHubConsumerGroup);
    if (!eventHubConsumerGroup) {
      console.error(
        `Environment variable EventHubConsumerGroup must be specified.`
      );
      return;
    }
    // console.log(`Using event hub consumer group [${eventHubConsumerGroup}]`);

    // Redirect requests to the public subdirectory to the root
    const app = express();
    app.use(express.static(path.join(__dirname, "public")));
    app.use((req, res /* , next */) => {
      res.redirect("/");
    });

    const server = http.createServer(app);
    const wss = new WebSocket.Server({ server });

    wss.broadcast = (data) => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          try {
            // console.log(`Broadcasting data ${data}`);
            client.send(data);
          } catch (e) {
            console.error(e);
          }
        }
      });
    };

    server.listen(process.env.PORT || "3030", () => {
      // console.log("Listening on %d.", server.address().port);
    });

    const eventHubReader = new EventHubReader(
      iotHubConnectionString,
      eventHubConsumerGroup
    );

    (async () => {
      await eventHubReader.startReadMessage((message, date, deviceId) => {
        try {
          const payload = {
            IotData: message,
            MessageDate: date || Date.now().toISOString(),
            DeviceId: deviceId,
          };

          wss.broadcast(JSON.stringify(payload));

          const dev = datas.filter((item) => item.id === deviceId);
          // console.log("dev: ", dev);
          // Gửi tin nhắn C2D tới thiết bị với ID là deviceId
          if (water) {
            if (message.humidity > dev[0].water) {
              if (dev[0].humidity > dev[0].water) {
                console.log("Đã tưới cây cho:", deviceId, dev[0].humidity);
              } else {
                sendC2DMessage(deviceId, "Tưới cây đi");
                console.log("Tưới cây cho: ", deviceId);
              }
            }
          }
          if (lamp) {
            if (message.temperature > dev[0].lamp) {
              if (dev[0].temperature > dev[0].lamp) {
                console.log("Đã bật đèn cho:", deviceId, dev[0].temperature);
              } else {
                sendC2DMessage(deviceId, "Bật đèn hộ cái");
                console.log("Bật đèn cho: ", deviceId);
              }
            }
          }

          datas[dev[0].index].temperature = message.temperature;
          datas[dev[0].index].humidity = message.humidity;
          datas[dev[0].index].pressure = message.pressure;
        } catch (err) {
          console.error("Error broadcasting: [%s] from [%s].", err, message);
        }
      });

      function printResultFor(op) {
        return function printResult(err, res) {
          // if (err) console.log(op + " error: " + err.toString());
          // if (res) console.log(op + " status: " + res.constructor.name);
        };
      }

      function receiveFeedback(err, receiver) {
        receiver.on("message", function (msg) {
          // console.log("Feedback message:");
          // console.log(msg.getData().toString("utf-8"));
        });
      }

      async function sendC2DMessage(deviceId, message) {
        try {
          const serviceClient = Client.fromConnectionString(iotHubConnectionString);

          // ...
          serviceClient.open((err) => {
            if (err) {
              console.error("Could not connect: " + err.message);
            } else {
              console.log("Service client connected");
              serviceClient.getFeedbackReceiver(receiveFeedback);
              const c2dMessage = new Message(message);
              c2dMessage.ack = "full";
              c2dMessage.messageId = "My Message ID";
              // console.log("Sending message: " + c2dMessage.getData());
              serviceClient.send(deviceId, c2dMessage, printResultFor("send"));
            }
          });
        } catch (error) {
          console.error("Error sending C2D message:", error);
        }
      }
    })().catch();

  })
  .catch((error) => {
    console.error("Error fetching data from the database:", error);
  });

