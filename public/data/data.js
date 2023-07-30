// Mảng dữ liệu datas
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

// Lưu mảng datas vào localStorage
localStorage.setItem("datas", JSON.stringify(datas));

// Khi muốn truy xuất lại mảng datas từ localStorage
const storedDatas = JSON.parse(localStorage.getItem("datas"));

console.log(storedDatas); // Hiển thị mảng dữ liệu đã được lưu trong localStorage


module.exports = datas;
