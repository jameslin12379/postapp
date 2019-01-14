// by default, user page displays user information and latest 10 posts
// when scrolled to the bottom, send ajax GET request to API server to retrieve next set of
// 10 posts and if successful append them into the page
// stop sending ajax requests when there are no more posts
//
// const loadMore = document.querySelector('#loadMore');
// const container = document.querySelector('#container');
// const API_URL = window.location.hostname.includes("dev") ? 'https://api.post67.com.dev/comments' : 'https://api.post67.com/comments';
// const API_URL2 = window.location.hostname.includes("dev") ? 'https://api.post67.com.dev/users' : 'https://api.post67.com/users';
// let url = window.location.pathname;
// // const lastcharacter = url[url.length-1];
// // if (lastcharacter === '/'){
// //     url = url.substring(0, url.length-1);
// // }
// // url = url.substring(0, url.lastIndexOf('/'));
// let postid = url.substring(url.lastIndexOf('/')+1);
// let count = document.getElementsByClassName('container-item').length;
// let total = Number(document.getElementById('commentscount').innerText);
// let skip = count;
// let limit = 10;
// let loading = false;
//
// document.addEventListener('scroll', () => {
//     const rect = loadMore.getBoundingClientRect();
//     if (rect.top < window.innerHeight && !loading) {
//         loading = true;
//         if (count < total) {
//             fetch(`${API_URL}?filter[fields][id]=true&filter[fields][description]=true&filter[fields][datecreated]=true&filter[fields][userid]=true&filter[where][postid]=${postid}&filter[order]=datecreated%20DESC&filter[limit]=${limit}&filter[skip]=${skip}`).then(response => response.json()).then(result => {
//                 let userids = [];
//                 for(let i = 0; i <result.length; i++){
//                     userids.push(result[i].userid);
//                 }
//                 fetch(`${API_URL2}?filter={"where":{"id":{"inq":[${userids}]}}}`).then(response => response.json())
//                     .then(r => {
//                         console.log(r);
//                         console.log(result);
//                         // r.forEach(user => {
//                             // const div = document.createElement('div');
//                             // div.classList.add("gallery-item");
//                             // const link = document.createElement('a');
//                             // link.classList.add(["gallery-item-a", "mr-none"]);
//                             // link.setAttribute("href", `/users/${user.id}`);
//                             // const i = document.createElement('img');
//                             // i.classList.add(["gallery-item-img"]);
//                             // i.setAttribute("src", user.imageurl);
//                             // i.setAttribute("alt", "");
//                             // link.appendChild(i);
//                             // div.appendChild(link);
//                             // galleryElement.appendChild(div);
//                         // });
//                     });
//
//
//                 // result.forEach(comment => {
//                     // const div = document.createElement('div');
//                     // div.classList.add("et_pb_module");
//                     // div.classList.add("et_pb_blurb");
//                     // div.classList.add("et_pb_blurb_2");
//                     // div.classList.add("et_pb_bg_layout_light");
//                     // div.classList.add("et_pb_text_align_left");
//                     // div.classList.add("et_pb_blurb_position_left");
//                     // div.classList.add("mb-30");
//                     // div.classList.add("box-shadow-none");
//                     // div.classList.add("container-item");
//                     // const div2 = document.createElement('div');
//                     // div2.classList.add("et_pb_blurb_content");
//                     // const div3 = document.createElement('div');
//                     // div3.classList.add("et_pb_blurb_container");
//                     // const link = document.createElement('a');
//                     // link.setAttribute("href", `/comments/${comment.id}`);
//                     // const h4 = document.createElement('h4');
//                     // h4.classList.add("et_pb_module_header");
//                     // h4.innerText = comment.description;
//                     // const div4 = document.createElement('div');
//                     // div4.classList.add("et_pb_blurb_description");
//                     // const p2 = document.createElement('p');
//                     // const str = document.createElement('strong');
//                     // str.innerText = moment(comment.datecreated).format('LLL');
//                     // div.appendChild(div2);
//                     // div2.appendChild(div3);
//                     // div3.appendChild(link);
//                     // link.appendChild(h4);
//                     // div3.appendChild(div4);
//                     // div4.appendChild(p2);
//                     // p2.appendChild(str);
//                     // container.appendChild(div);
//                 // });
//                 // count = document.getElementsByClassName('container-item').length;
//                 // skip = count;
//                 // loading = false;
//             });
//         }
//     }
// });

// send a request to API server not using its syntax to perform a join query behind the scenes and return data
//

const loadMore = document.querySelector('#loadMore');
const container = document.querySelector('#container');
let url = window.location.pathname;
let postid = url.substring(url.lastIndexOf('/')+1);
let count = document.getElementsByClassName('container-item').length;
let total = Number(document.getElementById('commentscount').innerText);
let skip = count;
let loading = false;
const API_URL = window.location.hostname.includes("dev") ? `https://post67.com.dev/posts/${postid}/comments` : `https://post67.com/posts/${postid}/comments`;

// const lastcharacter = url[url.length-1];
// if (lastcharacter === '/'){
//     url = url.substring(0, url.length-1);
// }
// url = url.substring(0, url.lastIndexOf('/'));


document.addEventListener('scroll', () => {
    const rect = loadMore.getBoundingClientRect();
    if (rect.top < window.innerHeight && !loading) {
        loading = true;
        if (count < total) {
            console.log(API_URL + `?skip=${skip}`);
            fetch(API_URL + `?skip=${skip}`).then(response => response.json()).then(result => {
                result = result.results;
                result.forEach(comment => {
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
                    link.setAttribute("href", `/comments/${comment.id}`);
                    const h4 = document.createElement('h4');
                    h4.classList.add("et_pb_module_header");
                    h4.innerText = comment.description;
                    const div4 = document.createElement('div');
                    div4.classList.add("et_pb_blurb_description");
                    const link2 = document.createElement('a');
                    link2.setAttribute("href", `/users/${comment.userid}`);
                    const h42 = document.createElement('h4');
                    h42.classList.add("et_pb_module_header");
                    h42.innerText = comment.username;
                    const p = document.createElement('p');
                    const str = document.createElement('strong');
                    str.innerText = moment(comment.datecreated).format('LLL');
                    div.appendChild(div2);
                    div2.appendChild(div3);
                    div3.appendChild(link);
                    link.appendChild(h4);
                    div3.appendChild(div4);
                    div4.appendChild(link2);
                    link2.appendChild(h42);
                    div4.appendChild(p);
                    p.appendChild(str);
                    container.appendChild(div);
                });
                    count = document.getElementsByClassName('container-item').length;
                    skip = count;
                    console.log(skip);
                    loading = false;
            });
        }
    }
});

// send a request to API server not using its syntax to perform a join query behind the scenes and return data
//
