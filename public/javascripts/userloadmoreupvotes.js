// // const loadMoreElement = document.querySelector('#loadMore');
// // const galleryElement = document.querySelector('#gallery');
// // const API_URL = window.location.hostname.includes("dev") ? 'https://api.gif67.com.dev/topicfollowings' : 'https://api.gif67.com/topicfollowings';
// // const API_URL2 = window.location.hostname.includes("dev") ? 'https://api.gif67.com.dev/topics' : 'https://api.gif67.com/topics';
// //
// // const url = window.location.href;
// // const first = url.substring(0, url.lastIndexOf('/'));
// // const userid = first.substring(first.lastIndexOf('/')+1);
// // let count = document.getElementsByClassName('gallery-item').length;
// // const total = Number(document.getElementById('count').getAttribute('data-count'));
// // let skip = count;
// // let limit = 12;
// //
// // document.addEventListener('scroll', () => {
// //     const rect = loadMoreElement.getBoundingClientRect();
// //     if (rect.top < window.innerHeight) {
// //         if (count < total) {
// //             fetch(`${API_URL}?filter[fields][followed]=true&filter[where][following]=${userid}
// //     &filter[order]=datecreated%20DESC&filter[limit]=${limit}&filter[skip]=${skip}`).then(response => response.json())
// //                 .then(result => {
// //                     let topicids = [];
// //                     for(let i = 0; i <result.length; i++){
// //                         topicids.push(result[i].followed);
// //                     }
// //                     fetch(`${API_URL2}?filter={"where":{"id":{"inq":[${topicids}]}}}`).then(response => response.json())
// //                         .then(r => {
// //                             r.forEach(topic => {
// //                                 const div = document.createElement('div');
// //                                 div.classList.add("gallery-item");
// //                                 const link = document.createElement('a');
// //                                 link.classList.add(["gallery-item-a", "mr-none"]);
// //                                 link.setAttribute("href", `/topics/${topic.id}`);
// //                                 const i = document.createElement('img');
// //                                 i.classList.add(["gallery-item-img"]);
// //                                 i.setAttribute("src", topic.imageurl);
// //                                 i.setAttribute("alt", "");
// //                                 link.appendChild(i);
// //                                 div.appendChild(link);
// //                                 galleryElement.appendChild(div);
// //                             });
// //                         });
// //                 });
// //             count = document.getElementsByClassName('gallery-item').length;
// //             skip = count;
// //         }
// //     }
// // });
//
// // by default, user page displays user information and latest 10 topicfollowings
// // when scrolled to the bottom, send ajax GET request to API server to retrieve next set of
// // 10 topicfollowings and if successful append them into the page
// // stop sending ajax requests when there are no more posts
//
// const loadMore = document.querySelector('#loadMore');
// const container = document.querySelector('#container');
// const API_URL = window.location.hostname.includes("dev") ? 'https://api.post67.com.dev/upvotes' : 'https://api.post67.com/upvotes';
// const API_URL2 = window.location.hostname.includes("dev") ? 'https://api.post67.com.dev/posts' : 'https://api.post67.com/posts';
// let url = window.location.href;
// const lastcharacter = url[url.length-1];
// if (lastcharacter === '/'){
//     url = url.substring(0, url.length-1);
// }
// url = url.substring(0, url.lastIndexOf('/'));
// let userid = url.substring(url.lastIndexOf('/')+1);
// let count = document.getElementsByClassName('container-item').length;
// let total = Number(document.getElementById('upvotescount').innerText);
// let skip = count;
// let limit = 10;
// let loading = false;
//
// document.addEventListener('scroll', () => {
//     const rect = loadMore.getBoundingClientRect();
//     if (rect.top < window.innerHeight && !loading) {
//         loading = true;
//         if (count < total) {
//             fetch(`${API_URL}?filter[fields][upvoted]=true&filter[where][upvote]=${userid}&filter[order]=datecreated%20DESC&filter[limit]=${limit}&filter[skip]=${skip}`).then(response => response.json())
//                 .then(result => {
//                     let postids = [];
//                     for (let i = 0; i < result.length; i++) {
//                         postids.push(result[i].upvoted);
//                     }
//                     fetch(`${API_URL2}?filter={"where":{"id":{"inq":[${postids}]}}}`).then(response => response.json())
//                         .then(r => {
//                             r.forEach(post => {
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
//                                 link.setAttribute("href", `/posts/${post.id}`);
//                                 const h4 = document.createElement('h4');
//                                 h4.classList.add("et_pb_module_header");
//                                 h4.innerText = post.name;
//                                 const div4 = document.createElement('div');
//                                 div4.classList.add("et_pb_blurb_description");
//                                 const p1 = document.createElement('p');
//                                 p1.innerText = post.description;
//                                 const i = document.createElement('img');
//                                 i.setAttribute("src", post.imageurl);
//                                 const p2 = document.createElement('p');
//                                 const str = document.createElement('strong');
//                                 str.innerText = moment(post.datecreated).format('LLL');
//                                 div.appendChild(div2);
//                                 div2.appendChild(div3);
//                                 div3.appendChild(link);
//                                 link.appendChild(h4);
//                                 div3.appendChild(div4);
//                                 div4.appendChild(p1);
//                                 div4.appendChild(i);
//                                 div4.appendChild(p2);
//                                 p2.appendChild(str);
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
let total = Number(document.getElementById('upvotescount').innerText);
let skip = count;
let loading = false;
const API_URL = window.location.hostname.includes("dev") ? `https://www.post67.com.dev/api/users/${userid}/upvotes` : `https://www.post67.com/api/users/${userid}/upvotes`;

document.addEventListener('scroll', () => {
    const rect = loadMore.getBoundingClientRect();
    if (rect.top < window.innerHeight && !loading) {
        loading = true;
        if (count < total) {
            fetch(API_URL + `?skip=${skip}`).then(response => response.json()).then(result => {
                result = result.results;
                result.forEach(post => {
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
                    link.setAttribute("href", `/posts/${post.id}`);
                    const h4 = document.createElement('h4');
                    h4.classList.add("et_pb_module_header");
                    h4.innerText = post.name;
                    const div4 = document.createElement('div');
                    div4.classList.add("et_pb_blurb_description");
                    const p1 = document.createElement('p');
                    p1.innerText = post.description;
                    const i = document.createElement('img');
                    i.setAttribute("src", post.imageurl);
                    const p2 = document.createElement('p');
                    const str = document.createElement('strong');
                    str.innerText = moment(post.datecreated).format('LLL');
                    div.appendChild(div2);
                    div2.appendChild(div3);
                    div3.appendChild(link);
                    link.appendChild(h4);
                    div3.appendChild(div4);
                    div4.appendChild(p1);
                    div4.appendChild(i);
                    div4.appendChild(p2);
                    p2.appendChild(str);
                    container.appendChild(div);
                });
                count = document.getElementsByClassName('container-item').length;
                skip = count;
                loading = false;
            });
        }
    }
});

