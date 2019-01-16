const loadMore = document.querySelector('#loadMore');
const container = document.querySelector('#container');
const API_URL = window.location.hostname.includes("dev") ? 'https://api.post67.com.dev/posts' : 'https://api.post67.com/posts';
let url = window.location.pathname;
const lastcharacter = url[url.length-1];
if (lastcharacter === '/'){
    url = url.substring(0, url.length-1);
}
let topicid = url.substring(url.lastIndexOf('/') + 1);
let count = document.getElementsByClassName('container-item').length;
let total = Number(document.getElementById('postscount').innerText);
let skip = count;
let limit = 10;
let loading = false;

document.addEventListener('scroll', () => {
    const rect = loadMore.getBoundingClientRect();
    if (rect.top < window.innerHeight && !loading) {
        loading = true;
        if (count < total) {
            fetch(`${API_URL}?filter[fields][id]=true&filter[fields][name]=true&filter[fields][description]=true&filter[fields][imageurl]=true&filter[fields][datecreated]=true&filter[where][topicid]=${topicid}&filter[order]=datecreated%20DESC&filter[limit]=${limit}&filter[skip]=${skip}`).then(response => response.json()).then(result => {
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


