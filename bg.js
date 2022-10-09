const body = document.querySelector("body");

// 이미지 갯수
const IMG_NUMBER=5;

// 랜덤 숫자 생성
function genRandom(){
    return Math.ceil(Math.random()* IMG_NUMBER);
}

// 랜덤 이미지 출력
function paintImage(imgNumber) {
    const img = new Image();
    img.src = `images/${imgNumber}.jpg`;
    img.classList.add("bgImg");
    body.prepend(img);
}

// 랜덤 수 생성해서, 랜덤 이미지 출력하기
function init() {
    const randomNumber = genRandom();
    paintImage(randomNumber);
}

init();