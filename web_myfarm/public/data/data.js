let datas = [
  {
    id: "mydeviceID",
    index: 0,
    location: "Nhà 1",
    name: "Device 1",
    description: "",
    water: 70,
    lamp: 25,
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

module.exports = datas;
