// const loadMore = document.querySelector('#loadMore');
// const container = document.querySelector('#container');
// const API_URL = window.location.hostname.includes("dev") ? 'https://api.post67.com.dev/topicfollowings' : 'https://api.post67.com/topicfollowings';
// const API_URL2 = window.location.hostname.includes("dev") ? 'https://api.post67.com.dev/topics' : 'https://api.post67.com/topics';
// let url = window.location.href;
// const lastcharacter = url[url.length-1];
// if (lastcharacter === '/'){
//     url = url.substring(0, url.length-1);
// }
// url = url.substring(0, url.lastIndexOf('/'));
// let userid = url.substring(url.lastIndexOf('/')+1);
// let count = document.getElementsByClassName('container-item').length;
// let total = Number(document.getElementById('followingcount').innerText);
// let skip = count;
// let limit = 10;
// let loading = false;
//
// document.addEventListener('scroll', () => {
//     const rect = loadMore.getBoundingClientRect();
//     if (rect.top < window.innerHeight && !loading) {
//         loading = true;
//         if (count < total) {
//             fetch(`${API_URL}?filter[fields][followed]=true&filter[where][following]=${userid}&filter[order]=datecreated%20DESC&filter[limit]=${limit}&filter[skip]=${skip}`).then(response => response.json())
//                 .then(result => {
//                     let topicids = [];
//                     for (let i = 0; i < result.length; i++) {
//                         topicids.push(result[i].followed);
//                     }
//                     fetch(`${API_URL2}?filter={"where":{"id":{"inq":[${topicids}]}}}`).then(response => response.json())
//                         .then(r => {
//                             r.forEach(topic => {
//                                 const div = document.createElement('div');
//                                 div.classList.add("et_pb_module");
//                                 div.classList.add("et_pb_blurb");
//                                 div.classList.add("et_pb_blurb_2");
//                                 div.classList.add("et_pb_bg_layout_light");
//                                 div.classList.add("et_pb_text_align_left");
//                                 div.classList.add("et_pb_blurb_position_left");
//                                 div.classList.add("mb-30");
//                                 div.classList.add("box-shadow-none");
//                                 div.classList.add("container-item");
//                                 const div2 = document.createElement('div');
//                                 div2.classList.add("et_pb_blurb_content");
//                                 const div3 = document.createElement('div');
//                                 div3.classList.add("et_pb_blurb_container");
//                                 const link = document.createElement('a');
//                                 link.setAttribute("href", `/topics/${topic.id}`);
//                                 const h4 = document.createElement('h4');
//                                 h4.classList.add("et_pb_module_header");
//                                 h4.innerText = topic.name;
//                                 const div4 = document.createElement('div');
//                                 div4.classList.add("et_pb_blurb_description");
//                                 const i = document.createElement('img');
//                                 i.setAttribute("src", topic.imageurl);
//                                 div.appendChild(div2);
//                                 div2.appendChild(div3);
//                                 div3.appendChild(link);
//                                 link.appendChild(h4);
//                                 div3.appendChild(div4);
//                                 div4.appendChild(i);
//                                 container.appendChild(div);
//                             });
//                             count = document.getElementsByClassName('container-item').length;
//                             skip = count;
//                             loading = false;
//                         });
//                 });
//         }}});






const loadMore = document.querySelector('#loadMore');
const container = document.querySelector('#container');
let url = window.location.pathname;
const lastcharacter = url[url.length-1];
if (lastcharacter === '/'){
    url = url.substring(0, url.length-1);
}
url = url.substring(0, url.lastIndexOf('/'));
let userid = url.substring(url.lastIndexOf('/')+1);
let count = document.getElementsByClassName('container-item').length;
let total = Number(document.getElementById('followingcount').innerText);
let skip = count;
let limit = 10;
let loading = false;
const API_URL = window.location.hostname.includes("dev") ? `https://www.post67.com.dev/api/users/${userid}/following` : `https://www.post67.com/api/users/${userid}/following`;

document.addEventListener('scroll', () => {
    const rect = loadMore.getBoundingClientRect();
    if (rect.top < window.innerHeight && !loading) {
        loading = true;
        if (count < total) {
            fetch(API_URL + `?skip=${skip}`).then(response => response.json()).then(result => {
                result = result.results;
                result.forEach(topic => {
                    const div = document.createElement('div');
                    div.classList.add("et_pb_module");
                    div.classList.add("et_pb_blurb");
                    div.classList.add("et_pb_blurb_2");
                    div.classList.add("et_pb_bg_layout_light");
                    div.classList.add("et_pb_text_align_left");
                    div.classList.add("et_pb_blurb_position_left");
                    div.classList.add("mb-30");
                    div.classList.add("box-shadow-none");
                    div.classList.add("container-item");
                    const div2 = document.createElement('div');
                    div2.classList.add("et_pb_blurb_content");
                    const div3 = document.createElement('div');
                    div3.classList.add("et_pb_blurb_container");
                    const link = document.createElement('a');
                    link.setAttribute("href", `/topics/${topic.id}`);
                    const h4 = document.createElement('h4');
                    h4.classList.add("et_pb_module_header");
                    h4.innerText = topic.name;
                    const div4 = document.createElement('div');
                    div4.classList.add("et_pb_blurb_description");
                    const i = document.createElement('img');
                    i.setAttribute("src", topic.imageurl);
                    div.appendChild(div2);
                    div2.appendChild(div3);
                    div3.appendChild(link);
                    link.appendChild(h4);
                    div3.appendChild(div4);
                    div4.appendChild(i);
                    container.appendChild(div);
                });
                count = document.getElementsByClassName('container-item').length;
                skip = count;
                loading = false;
            });
        }
    }
});

