let hrefMod = window.location.href.split('http://localhost:3332/')[1].split('/')[0]
console.log(hrefMod)

hrefMod == '' ? hrefMod = 'dashboard' : hrefMod

document.getElementById(`${hrefMod}`).classList.add('active')
console.log(location.href.split(location.href))