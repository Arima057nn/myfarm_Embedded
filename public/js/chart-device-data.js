/* eslint-disable max-classes-per-file */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */

const datas = [
  {
    id: "mydeviceID",
    index: 0,
    location: "Nhà 1",
    name: "Device 1",
    description: "",
    water: 75,
    lamp: 26,
    temperature: 0,
    humidity: 0,
    pressure: 0,
    sendC2D: "listen-device-1",
  },
  {
    id: "Device3",
    index: 1, //Tự set cho nó bằng số thứ tự trong mảng
    location: "Nhà 2",
    name: "Device 2",
    description: "",
    water: 72,
    lamp: 22,
    temperature: 0, // defaule bằng 0
    humidity: 0, // defaule bằng 0
    pressure: 0, // defaule bằng 0
    sendC2D: "listen-device-2",
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
      this.present = new Array(3);
    }

    addData(time, temperature, humidity, pressure) {
      this.timeData.push(time);
      this.temperatureData.push(temperature);
      this.humidityData.push(humidity || null);
      this.pressureData.push(pressure || null);
      this.present = {
        temperature: temperature,
        humidity: humidity,
        pressure: pressure,
      };

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
  const lightData = {
    datasets: [
      {
        data: [0, 360],
        backgroundColor: [
          "#FD8D14", // Bật sưởi
          "#FFEEBB", // Tắt sưởi
        ],
        borderWidth: 0,
      },
    ],
  };

  const waterData = {
    datasets: [
      {
        data: [0, 360],
        backgroundColor: [
          "#19A7CE", // bật tưới
          "#C5DFF8", // tắt tưới
        ],
        borderWidth: 0,
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
  const ctxLight = document.getElementById("lightChart").getContext("2d");
  const ctxWater = document.getElementById("waterChart").getContext("2d");
  const myLineChart = new Chart(ctx, {
    type: "line",
    data: chartData,
    options: chartOptions,
  });

  const myLightChart = new Chart(ctxLight, {
    type: "pie",
    data: lightData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutoutPercentage: 5, // Kích thước của bóng đèn
      legend: {
        display: false,
      },
      tooltips: {
        enabled: false,
      },
    },
  });
  const myWaterChart = new Chart(ctxWater, {
    type: "pie",
    data: waterData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutoutPercentage: 5, // Kích thước của bóng đèn
      legend: {
        display: false,
      },
      tooltips: {
        enabled: false,
      },
    },
  });

  // Manage a list of devices in the UI, and update which device data the chart is showing
  // based on selection
  let needsAutoSelect = true;
  const deviceCount = document.getElementById("deviceCount");
  const listOfDevices = document.getElementById("listOfDevices");
  const deviceName = document.getElementById("device-name");
  const deviceLocation = document.getElementById("device-location");
  const deviceDescription = document.getElementById("device-description");
  const deviceLamp = document.getElementById("device-lamp");
  const deviceWater = document.getElementById("device-water");

  function OnSelectionChange() {
    const device = trackedDevices.findDevice(
      listOfDevices[listOfDevices.selectedIndex].text
    );

    const dev = datas.filter((item) => item.id === device.deviceId);

    console.log("DV:", dev[0]);
    deviceName.innerText = dev[0].name;
    deviceLocation.innerText = dev[0].location;
    deviceDescription.innerText = dev[0].description;
    deviceLamp.innerText = dev[0].lamp + " Pa";
    deviceWater.innerText = dev[0].water + " ºC";

    // table.innerHTML =
    //   '<div style="background:white;font-size:12px;position:fixed;top:35%;right:5px;border-radius:4px;"><h1>' +
    //   "name:" +
    //   dev[0].name +
    //   "<br>" +
    //   "position:" +
    //   dev[0].location +
    //   "<br>" +
    //   "lamp:" +
    //   dev[0].lamp +
    //   "Pa" +
    //   "<br>" +
    //   "water:" +
    //   dev[0].water +
    //   "ºC" +
    //   "</h1></div>";
    chartData.labels = device.timeData;
    chartData.datasets[0].data = device.temperatureData;
    chartData.datasets[1].data = device.humidityData;
    chartData.datasets[2].data = device.pressureData;
    console.log("first:", device.present);
    if (device.present.temperature > dev[0].lamp) {
      lightData.datasets[0].data = [360, 0];
      myLightChart.update();
    } else {
      lightData.datasets[0].data = [0, 360];
      myLightChart.update();
    }
    if (device.present.humidity > dev[0].water) {
      waterData.datasets[0].data = [360, 0];
      myWaterChart.update();
    } else {
      waterData.datasets[0].data = [0, 360];
      myWaterChart.update();
    }
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
        let dev = datas.filter((item) => item.id === messageData.DeviceId);
        // console.log("exist: ", dev);

        existingDeviceData.addData(
          messageData.MessageDate,
          messageData.IotData.temperature,
          messageData.IotData.humidity,
          messageData.IotData.pressure
        );
        if (messageData.IotData.temperature > dev[0].lamp) {
          lightData.datasets[0].data = [360, 0];
          myLightChart.update();
        } else {
          lightData.datasets[0].data = [0, 360];
          myLightChart.update();
        }
        if (messageData.IotData.humidity > dev[0].water) {
          waterData.datasets[0].data = [360, 0];
          myWaterChart.update();
        } else {
          waterData.datasets[0].data = [0, 360];
          myWaterChart.update();
        }
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
