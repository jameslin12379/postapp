const loadMoreElement = document.querySelector('#loadMore');
const galleryElement = document.querySelector('#gallery');
const API_URL = window.location.hostname.includes("dev") ? 'https://api.gif67.com.dev/topicfollowings' : 'https://api.gif67.com/topicfollowings';
const API_URL2 = window.location.hostname.includes("dev") ? 'https://api.gif67.com.dev/users' : 'https://api.gif67.com/users';

const url = window.location.href;
const first = url.substring(0, url.lastIndexOf('/'));
const topicid = first.substring(first.lastIndexOf('/')+1);
let count = document.getElementsByClassName('gallery-item').length;
const total = Number(document.getElementById('count').getAttribute('data-count'));
let skip = count;
let limit = 12;

document.addEventListener('scroll', () => {
    const rect = loadMoreElement.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
        if (count < total) {
            fetch(`${API_URL}?filter[fields][following]=true&filter[where][followed]=${topicid}
    &filter[order]=datecreated%20DESC&filter[limit]=${limit}&filter[skip]=${skip}`).then(response => response.json())
                .then(result => {
                    let userids = [];
                    for(let i = 0; i <result.length; i++){
                        userids.push(result[i].following);
                    }
                    fetch(`${API_URL2}?filter={"where":{"id":{"inq":[${userids}]}}}`).then(response => response.json())
                        .then(r => {
                            r.forEach(user => {
                                const div = document.createElement('div');
                                div.classList.add("gallery-item");
                                const link = document.createElement('a');
                                link.classList.add(["gallery-item-a", "mr-none"]);
                                link.setAttribute("href", `/users/${user.id}`);
                                const i = document.createElement('img');
                                i.classList.add(["gallery-item-img"]);
                                i.setAttribute("src", user.imageurl);
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