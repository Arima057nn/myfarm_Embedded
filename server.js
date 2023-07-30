const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const EventHubReader = require("./scripts/event-hub-reader.js");

var Client = require("azure-iothub").Client;
var Message = require("azure-iot-common").Message;
let lamp = true;
let water = true;
let dev1 = {
  temperature: 0,
  humidity: 0,
  pressure: 0,
};
let dev2 = {
  temperature: 0,
  humidity: 0,
  pressure: 0,
};

const datas = [
  {
    id: "mydeviceID",
    location: "Nhà 1",
    name: "Device 1",
    description: "",
    water: 70,
    lamp: 20,
  },
  {
    id: "Device3",
    location: "Nhà 2",
    name: "Device 2",
    description: "",
    water: 72,
    lamp: 22,
  },
];

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

      // Gửi tin nhắn C2D tới thiết bị với ID là deviceId
      if (water) {
        if (message.humidity > dev[0].water) {
          if (deviceId === "mydeviceID" && dev1.humidity > dev[0].water) {
            console.log("Đang tưới cây cho mydeviceID rồi", dev1.humidity);
          } else if (deviceId === "Device3" && dev2.humidity > dev[0].water) {
            console.log("Đang tưới cây cho Device3 rồi", dev2.humidity);
          } else {
            sendC2DMessage(deviceId, "Tưới cây đi");
            console.log("Tưới cây cho: ", deviceId);
          }
        }
      }
      if (lamp) {
        if (message.temperature > dev[0].lamp) {
          if (deviceId === "mydeviceID" && dev1.temperature > dev[0].lamp) {
            console.log("Đang bật đèn cho mydeviceID rồi", dev1.temperature);
          } else if (deviceId === "Device3" && dev2.temperature > dev[0].lamp) {
            console.log("Đang bật đèn cho Device3 rồi", dev2.temperature);
          } else {
            sendC2DMessage(deviceId, "Bật đèn hộ cái");
            console.log("Bật đèn cho: ", deviceId);
          }
        }
      }
      if (deviceId === "mydeviceID") {
        dev1.temperature = message.temperature;
        dev1.humidity = message.humidity;
        dev1.pressure = message.pressure;
      }
      if (deviceId === "Device3") {
        dev2.temperature = message.temperature;
        dev2.humidity = message.humidity;
        dev2.pressure = message.pressure;
      }
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
