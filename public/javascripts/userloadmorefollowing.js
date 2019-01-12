const loadMoreElement = document.querySelector('#loadMore');
const galleryElement = document.querySelector('#gallery');
const API_URL = window.location.hostname.includes("dev") ? 'https://api.gif67.com.dev/topicfollowings' : 'https://api.gif67.com/topicfollowings';
const API_URL2 = window.location.hostname.includes("dev") ? 'https://api.gif67.com.dev/topics' : 'https://api.gif67.com/topics';

const url = window.location.href;
const first = url.substring(0, url.lastIndexOf('/'));
const userid = first.substring(first.lastIndexOf('/')+1);
let count = document.getElementsByClassName('gallery-item').length;
const total = Number(document.getElementById('count').getAttribute('data-count'));
let skip = count;
let limit = 12;

document.addEventListener('scroll', () => {
    const rect = loadMoreElement.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
        if (count < total) {
            fetch(`${API_URL}?filter[fields][followed]=true&filter[where][following]=${userid}
    &filter[order]=datecreated%20DESC&filter[limit]=${limit}&filter[skip]=${skip}`).then(response => response.json())
                .then(result => {
                    let topicids = [];
                    for(let i = 0; i <result.length; i++){
                        topicids.push(result[i].followed);
                    }
                    fetch(`${API_URL2}?filter={"where":{"id":{"inq":[${topicids}]}}}`).then(response => response.json())
                        .then(r => {
                            r.forEach(topic => {
                                const div = document.createElement('div');
                                div.classList.add("gallery-item");
                                const link = document.createElement('a');
                                link.classList.add(["gallery-item-a", "mr-none"]);
                                link.setAttribute("href", `/topics/${topic.id}`);
                                const i = document.createElement('img');
                                i.classList.add(["gallery-item-img"]);
                                i.setAttribute("src", topic.imageurl);
                                i.setAttribute("alt", "");
                                link.appendChild(i);
                                div.appendChild(link);
                                galleryElement.appendChild(div);
                            });
                        });
                });
            count = document.getElementsByClassName('gallery-item').length;
            skip = count;
        }
    }
});