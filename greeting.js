// js-form의 input과 js-greetings 가져오기
const form = document.querySelector(".js-form"),
    input = form.querySelector("input"),
    greeting = document.querySelector(".js-greetings");

const USER_LS = "currentUser", 
    SHOWING_CN = "showing";

// 이름을 로걸저장소에 저장
function saveName(text){
    localStorage.setItem(USER_LS, text);
}

// 제출을 누르면 해당 값(이름)을 출력하고 저장
function handleSubmit(event){
    event.preventDefault();
    const currentValue = input.value;
    paintGreeting(currentValue);
    saveName(currentValue);
}

// js-form이 보이게 해서 이름 물어보기
function askForName() {
    form.classList.add(SHOWING_CN);
    form.addEventListener("submit", handleSubmit);
}

// 이름 보여주기
function paintGreeting(text) {
    // 이름 물어보는거 안보이게 하기
    form.classList.remove(SHOWING_CN);
    // js-greeting 보이게 하기
    greeting.classList.add(SHOWING_CN);
    // 시간 받아오기
    const date = new Date();
    const hours = date.getHours();
    let mention = 'Hello';
    if(0<= hours && hours <= 4 || 20 < hours){
        // 시간이 0시~4시 이거나 20시 넘으면 굿나잇
        mention = 'Good night';
    } else if (hours<12){
        // 시간이 5시~12시이면 굿모닝
        mention = 'Good morning';
    } else{
        // 13시부터 20시까지는 굿애프터눈
        mention = 'Good afternoon';
    }
    // js-greeting에 innerText 넣어주기
    greeting.innerText = `${mention}, ${text}.`;
}

// 이름 불러오기
function loadName() {
    const currentUser = localStorage.getItem(USER_LS);
    // 저장된 이름이 없으면 물어보기
    if(currentUser === null){
        askForName();
    }else{
        // 저장된 이름이 있으면 출력하기
        paintGreeting(currentUser);
    }
}
function init() {
    loadName();
}

init();