// by default, user page displays user information and latest 12 images
// when scrolled to the bottom, send ajax GET request to API server to retrieve next set of
// 12 images and if successful append them into the page
// stop sending ajax requests when there are no more images

const loadMoreElement = document.querySelector('#loadMore');
const galleryElement = document.querySelector('#gallery');
const API_URL = window.location.hostname.includes("dev") ? 'https://api.gif67.com.dev/images' : 'https://api.gif67.com/images';
const url = window.location.href;
const topicid = url.substring(url.lastIndexOf('/') + 1);
let count = document.getElementsByClassName('gallery-item').length;
const total = Number(document.getElementById('count').getAttribute('data-count'));
let skip = count;
let limit = 12;

document.addEventListener('scroll', () => {
    const rect = loadMoreElement.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
        if (count < total) {
            fetch(`${API_URL}?filter[fields][id]=true&filter[fields][imageurl]=true&filter[where][topicid]=${topicid}
    &filter[order]=datecreated%20DESC&filter[limit]=${limit}&filter[skip]=${skip}`).then(response => response.json())
                .then(result => {
                    result.forEach(image => {
                        const div = document.createElement('div');
                        div.classList.add("gallery-item");
                        const link = document.createElement('a');
                        link.classList.add(["gallery-item-a", "mr-none"]);
                        link.setAttribute("href", `/images/${image.id}`);
                        const i = document.createElement('img');
                        i.classList.add("gallery-item-img");
                        i.setAttribute("src", image.imageurl);
                        i.setAttribute("alt", "");
                        link.appendChild(i);
                        div.appendChild(link);
                        galleryElement.appendChild(div);

                    });
                });
            count = document.getElementsByClassName('gallery-item').length;
            skip = count;
        }
    }
});