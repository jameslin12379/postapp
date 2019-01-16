const loadMore = document.querySelector('#loadMore');
const container = document.querySelector('#container');
let url = window.location.pathname;
const lastcharacter = url[url.length-1];
if (lastcharacter === '/'){
    url = url.substring(0, url.length-1);
}
let postid = url.substring(url.lastIndexOf('/')+1);
let count = document.getElementsByClassName('container-item').length;
let total = Number(document.getElementById('commentscount').innerText);
let skip = count;
let loading = false;
const API_URL = window.location.hostname.includes("dev") ? `https://www.post67.com.dev/api/posts/${postid}/comments` : `https://www.post67.com/api/posts/${postid}/comments`;

document.addEventListener('scroll', () => {
    const rect = loadMore.getBoundingClientRect();
    if (rect.top < window.innerHeight && !loading) {
        loading = true;
        if (count < total) {
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
                    const p2 = document.createElement('p');
                    const str = document.createElement('strong');
                    str.innerText = moment(comment.datecreated).format('LLL');
                    div.appendChild(div2);
                    div2.appendChild(div3);
                    div3.appendChild(link);
                    link.appendChild(h4);
                    div3.appendChild(div4);
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


