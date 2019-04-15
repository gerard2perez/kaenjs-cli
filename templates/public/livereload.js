// KaenCLI patchv1
var style = document.createElement('style');
style.type = 'text/css';
style.innerHTML =`
.livereloadwrapper {
	width: 100%;
	text-align:center;
	position: fixed;
    z-index: 100000;
	top: 0.5em;
	pointer-events: none;
}
.livereloadspin p {
	margin: 0px !important;
}
.livereloadspin {
	padding: 0 20px;
    background-color: #212121e8;
    width: auto;
    display: inline-flex;
    color: #fff;
    border-radius: 8px;
    left: 25%;
    height: 3em;
    align-items: center;
    min-width: 200px;
    border: 1px solid #1f1f1f;
}
.livereloadspinloader,
.livereloadspinloader:after {
	border-radius: 50%;
    width: 3em;
    height: 3em;
}
.livereloadspinloader {
	margin-right:10px;
    font-size: 10px;
    position: relative;
    text-indent: -9999em;
    border-top: .3em solid #fff3;
    border-right: .3em solid #fff3;
    border-bottom: .3em solid #fff3;
    border-left: .3em solid #fff;
    -webkit-transform: translateZ(0);
    -ms-transform: translateZ(0);
    transform: translateZ(0);
    -webkit-animation: load8 1.1s infinite linear;
    animation: load8 1.1s infinite linear;
}
@-webkit-keyframes load8 {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
@keyframes load8 {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}`;
let wrapper = document.createElement('div');
let holder = document.createElement('div');
let text = document.createElement('p');
holder.innerHTML = `<span class="livereloadspinloader"></span>`;
holder.appendChild(text);
holder.className = 'livereloadspin';
wrapper.className = 'livereloadwrapper';
wrapper.appendChild(holder);
document.getElementsByTagName('head')[0].appendChild(style);
// let wait = setInterval(()=>{
	// if(window.LiveReload && LiveReload.initialized ) {
		// clearInterval(wait);
LiveReload.prototype.performAlert = function(message) {
	let BODY = document.getElementsByTagName('body')[0];
	if(message.message.kaen === 'show') {
		BODY.appendChild(wrapper);
		text.innerHTML = message.message.data;
	} else if(message.message.kaen === 'hide') {
		BODY.removeChild(wrapper);
	}
}
	// }
// }, 100);
