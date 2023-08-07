const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const EventHubReader = require("./scripts/event-hub-reader.js");
let datas = require("./public/data/data.js");

var Client = require("azure-iothub").Client;
var Message = require("azure-iot-common").Message;
let lamp = true;
let water = true;

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
      console.log("dev: ", deviceId);
      // Gửi tin nhắn C2D tới thiết bị với ID là deviceId

      message_text = "";

      if (water) {
        if (message.humidity < dev[0].water) {
          if (dev[0].humidity < dev[0].water) {
            console.log("Đã tưới cây cho:", deviceId, dev[0].humidity);
          } else {
            // sendC2DMessage(dev[0].sendC2D, "bat-tuoi");
            // concate messafe_text with "bat-tuoi"
            message_text += "bat-tuoi";
            console.log("Bật tưới cây cho: ", deviceId);
          }
        } else {
          if (dev[0].humidity > dev[0].water) {
            console.log("Đã tắt tưới cây cho:", deviceId, dev[0].humidity);
          } else {
            // console.log("Bật tưới cây cho: ", deviceId);
            // sendC2DMessage(dev[0].sendC2D, "tat-tuoi");
            // concate messafe_text with "tat-tuoi"
            message_text += "tat-tuoi";
          }
        }
      }

      if (lamp) {
        if (message.temperature < dev[0].lamp) {
          if (dev[0].temperature < dev[0].lamp) {
            console.log("Đã sưởi cây cho:", deviceId, dev[0].temperature);
          } else {
            // sendC2DMessage(dev[0].sendC2D, "bat-suoi");
            // concate messafe_text with "bat-suoi"
            message_text += "bat-suoi";
            console.log("Bật sưởi cây cho: ", deviceId);
          }
        } else {
          if (dev[0].temperature > dev[0].lamp) {
            console.log("Đã tắt sưởi cây cho:", deviceId, dev[0].temperature);
          } else {
            // console.log("Bật sưởi cây cho: ", deviceId);
            // sendC2DMessage(dev[0].sendC2D, "tat-suoi");
            // concate messafe_text with "tat-suoi"
            message_text += "tat-suoi";
          }
        }
      }

      if (message_text !== "") {
        sendC2DMessage(dev[0].sendC2D, message_text);
      }

      //tat tuoi, tat suoi, bat tuoi, bat suoi
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
