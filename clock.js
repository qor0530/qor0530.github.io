// js-clock class의 h1 가져오기
const clockContainer = document.querySelector(".js-clock");
const clockTitle = clockContainer.querySelector("h1");

// 시간을 받아서 h1의 innerText에 업데이트
function getTime() {
    const date = new Date();
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const seconds = date.getSeconds();
    clockTitle.innerText = `${hours<10?`0${hours}`:hours}:${minutes<10? `0${minutes}`:minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
}

// 1초마다 getTime()실행
function init () {
    getTime();
    setInterval(getTime, 1000);
}

init()