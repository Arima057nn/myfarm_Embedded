/* eslint-disable max-classes-per-file */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */

const datas = [
  {
    id: "mydeviceID",
    location: "Nhà 1",
    name: "Device 1",
    description: "",
    water: 70,
    lamp: 25,
  },
  {
    id: "Device3",
    location: "Nhà 2",
    name: "Device 2",
    description: "",
    water: 72,
    lamp: 27,
  },
];

$(document).ready(() => {
  // if deployed to a site supporting SSL, use wss://
  const protocol = document.location.protocol.startsWith("https")
    ? "wss://"
    : "ws://";
  const webSocket = new WebSocket(protocol + location.host);

  // A class for holding the last N points of telemetry for a device
  class DeviceData {
    constructor(deviceId) {
      this.deviceId = deviceId;
      this.maxLen = 50;
      this.timeData = new Array(this.maxLen);
      this.temperatureData = new Array(this.maxLen);
      this.humidityData = new Array(this.maxLen);
      this.pressureData = new Array(this.maxLen);
    }

    addData(time, temperature, humidity, pressure) {
      // if (checkBtn.checked && humidity > 70) console.log("Tưới nước má ơi !");
      // if (checkBtn2.checked && temperature < 30) console.log("Bật đèn má ơi !");

      this.timeData.push(time);
      this.temperatureData.push(temperature);
      this.humidityData.push(humidity || null);
      this.pressureData.push(pressure || null);

      if (this.timeData.length > this.maxLen) {
        this.timeData.shift();
        this.temperatureData.shift();
        this.humidityData.shift();
        this.pressureData.shift();
      }
    }
  }

  // All the devices in the list (those that have been sending telemetry)
  class TrackedDevices {
    constructor() {
      this.devices = [];
    }

    // Find a device based on its Id
    findDevice(deviceId) {
      for (let i = 0; i < this.devices.length; ++i) {
        if (this.devices[i].deviceId === deviceId) {
          // console.log("device", this.devices[i]);
          return this.devices[i];
        }
      }

      return undefined;
    }

    getDevicesCount() {
      return this.devices.length;
    }
  }

  const trackedDevices = new TrackedDevices();

  // Define the chart axes
  const chartData = {
    datasets: [
      {
        fill: false,
        label: "Temperature",
        yAxisID: "Temperature",
        borderColor: "rgba(255, 204, 0, 1)",
        pointBoarderColor: "rgba(255, 204, 0, 1)",
        backgroundColor: "rgba(255, 204, 0, 0.4)",
        pointHoverBackgroundColor: "rgba(255, 204, 0, 1)",
        pointHoverBorderColor: "rgba(255, 204, 0, 1)",
        spanGaps: true,
      },
      {
        fill: false,
        label: "Humidity",
        yAxisID: "Humidity",
        borderColor: "rgba(24, 120, 240, 1)",
        pointBoarderColor: "rgba(24, 120, 240, 1)",
        backgroundColor: "rgba(24, 120, 240, 0.4)",
        pointHoverBackgroundColor: "rgba(24, 120, 240, 1)",
        pointHoverBorderColor: "rgba(24, 120, 240, 1)",
        spanGaps: true,
      },
      {
        fill: false,
        label: "Pressure",
        yAxisID: "Pressure",
        borderColor: "#22A699",
        pointBoarderColor: "#22A699",
        backgroundColor: "#64CCC5",
        pointHoverBackgroundColor: "#22A699",
        pointHoverBorderColor: "#22A699",
        spanGaps: true,
      },
    ],
  };

  const chartOptions = {
    scales: {
      yAxes: [
        {
          id: "Temperature",
          type: "linear",
          scaleLabel: {
            labelString: "Temperature (ºC)",
            display: false,
          },
          position: "left",
          ticks: {
            suggestedMin: 0,
            suggestedMax: 100,
            beginAtZero: true,
          },
        },
        {
          id: "Humidity",
          type: "linear",
          scaleLabel: {
            labelString: "Humidity (%)",
            display: false,
          },
          position: "right",
          ticks: {
            suggestedMin: 0,
            suggestedMax: 100,
            beginAtZero: true,
          },
        },
        {
          display: false,
          id: "Pressure",
          type: "linear",
          scaleLabel: {
            labelString: "Pressure (Pa)",
            display: false,
          },
          position: "left",
          ticks: {
            suggestedMin: 0,
            suggestedMax: 100,
            beginAtZero: true,
          },
        },
      ],
    },
  };

  // Get the context of the canvas element we want to select
  const ctx = document.getElementById("iotChart").getContext("2d");
  const myLineChart = new Chart(ctx, {
    type: "line",
    data: chartData,
    options: chartOptions,
  });

  // Manage a list of devices in the UI, and update which device data the chart is showing
  // based on selection
  let needsAutoSelect = true;
  const deviceCount = document.getElementById("deviceCount");
  const listOfDevices = document.getElementById("listOfDevices");
  // const checkBtn = document.getElementById("autoSelect");
  // const checkBtn2 = document.getElementById("autoSelect2");
  const table = document.getElementById("info");

  function OnSelectionChange() {
    const device = trackedDevices.findDevice(
      listOfDevices[listOfDevices.selectedIndex].text
    );

    const dev = datas.filter((item) => item.id === device.deviceId);

    console.log("DV:", dev[0]);
    table.innerHTML =
      '<div style="background:white;font-size:12px;position:fixed;top:35%;right:5px;border-radius:4px;"><h1>' +
      "name:" +
      dev[0].name +
      "<br>" +
      "position:" +
      dev[0].location +
      "</h1></div>";
    chartData.labels = device.timeData;
    chartData.datasets[0].data = device.temperatureData;
    chartData.datasets[1].data = device.humidityData;
    chartData.datasets[2].data = device.pressureData;
    myLineChart.update();
  }
  listOfDevices.addEventListener("change", OnSelectionChange, false);

  // When a web socket message arrives:
  // 1. Unpack it
  // 2. Validate it has date/time and temperature
  // 3. Find or create a cached device to hold the telemetry data
  // 4. Append the telemetry data
  // 5. Update the chart UI
  webSocket.onmessage = function onMessage(message) {
    try {
      const messageData = JSON.parse(message.data);
      // console.log(messageData);

      // time and either temperature or humidity are required
      if (
        !messageData.MessageDate ||
        (!messageData.IotData.temperature &&
          !messageData.IotData.humidity &&
          !messageData.IotData.pressure)
      ) {
        return;
      }

      // find or add device to list of tracked devices
      const existingDeviceData = trackedDevices.findDevice(
        messageData.DeviceId
      );

      if (existingDeviceData) {
        existingDeviceData.addData(
          messageData.MessageDate,
          messageData.IotData.temperature,
          messageData.IotData.humidity,
          messageData.IotData.pressure
        );
      } else {
        const newDeviceData = new DeviceData(messageData.DeviceId);
        trackedDevices.devices.push(newDeviceData);
        const numDevices = trackedDevices.getDevicesCount();
        deviceCount.innerText =
          numDevices === 1 ? `${numDevices} device` : `${numDevices} devices`;
        newDeviceData.addData(
          messageData.MessageDate,
          messageData.IotData.temperature,
          messageData.IotData.humidity,
          messageData.IotData.pressure
        );

        // add device to the UI list
        const node = document.createElement("option");
        const nodeText = document.createTextNode(messageData.DeviceId);
        node.appendChild(nodeText);
        listOfDevices.appendChild(node);

        // if this is the first device being discovered, auto-select it
        if (needsAutoSelect) {
          needsAutoSelect = false;
          listOfDevices.selectedIndex = 0;
          OnSelectionChange();
        }
      }

      myLineChart.update();
    } catch (err) {
      console.error(err);
    }
  };
});
