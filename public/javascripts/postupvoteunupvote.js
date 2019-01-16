//// if value of button is follow, when clicked an ajax POST request will be sent
// to insert a new row between current user and topic and if successful
// a response will be sent back and text of button should be changed to unfollow
//// if value of button is unfollow, when clicked an ajax DELETE request will be sent
// to remove a row with current user and topic and if successful a response
// will be sent back and text of button should be changed to follow

const URL = window.location.origin + '/upvotes';
const upvotescount = document.getElementById('upvotescount');
const button = document.getElementById('upvoteunupvote');
button.addEventListener('click', function(event){
    if (button.innerText === 'Like') {
        upvotePost();
    } else {
        unupvotePost();
    }
})

function upvotePost(){
    // const url = document.getElementById('currentid').getAttribute('href');
    // const userid = url.substring(url.lastIndexOf('/') + 1);
    const postid = window.location.href.substring(window.location.href.lastIndexOf('/') + 1);
    fetch(URL, {
        method: 'POST',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({postid: postid})
    }).then(response => response.json())
        .then(result => {
            button.innerText = 'Liked';
            upvotescount.innerText = (Number(upvotescount.innerText) + 1) + '';
        });
}

function unupvotePost(){
    // const url = document.getElementById('currentid').getAttribute('href');
    // const userid = url.substring(url.lastIndexOf('/') + 1);
    const postid = window.location.href.substring(window.location.href.lastIndexOf('/') + 1);
    fetch(URL, {
        method: 'DELETE',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({postid: postid})
    }).then(response => response.json())
        .then(result => {
            button.innerText = 'Like';
            upvotescount.innerText = (Number(upvotescount.innerText) - 1) + '';

        });
}

