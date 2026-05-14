import{c as o}from"./api-Bx83V4km.js";const d="whiteboard_recent";function i(){try{return JSON.parse(localStorage.getItem(d))||[]}catch{return[]}}function r(t){localStorage.setItem(d,JSON.stringify(t.slice(0,20)))}function c(){const t=document.getElementById("board-list"),n=document.getElementById("empty-msg"),a=i();if(a.length===0){n.hidden=!1;return}n.hidden=!0,t.innerHTML=a.map(e=>`
    <li data-id="${e.id}">
      <span class="name">${e.name}</span>
      <span class="date">${new Date(e.visitedAt).toLocaleDateString("ko-KR")}</span>
    </li>
  `).join(""),t.querySelectorAll("li").forEach(e=>{e.addEventListener("click",()=>{location.href=`./board.html?id=${e.dataset.id}`})})}document.getElementById("new-board-btn").addEventListener("click",async()=>{const t=document.getElementById("new-board-btn");t.disabled=!0;try{const n=await o(),a=i().filter(e=>e.id!==n.id);a.unshift({id:n.id,name:n.name,visitedAt:new Date().toISOString()}),r(a),location.href=`./board.html?id=${n.id}`}finally{t.disabled=!1}});c();
