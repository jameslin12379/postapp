// when form is submitted, stop its default behavior
// extract data from form and submit using fetch post to /comments
// route will validate input and if there is an error, return
// failed = true to client and client using if conditional will toggle
// hidden error message and when user resubmits
// the same process repeats and assume this time validation passed
// so value gets saved to DB and using returned row data
// return it to client along with failed = false and
// using if conditional toggle error message so it is hidden again
// , clear textarea, and insert a comment using returned data row
// into DOM at the top of comments list and increment post comments count by 1

let commentform = document.getElementById('commentform');
let commentformurl = '/comments';
let commentformpostid = url.substring(url.lastIndexOf('/')+1);
let commentformtextarea = document.getElementById('commentformtextarea');
let commentformerrors = document.getElementsByClassName('commentformerrors');
let emptyerror = document.getElementById('emptyerror');
let lengtherror = document.getElementById('lengtherror');
let commentscount = document.getElementById('commentscount');


commentform.addEventListener('submit', (e)=> {
    e.preventDefault();
    let description = commentformtextarea.value;
    fetch(commentformurl, {
        method: 'POST',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({description: description, postid: commentformpostid})
    }).then(response => response.json()).then(result => {
            if (!result.status) {
                for (let i = 0; i < result.errors.length; i++) {
                    if (result.errors[i].msg === "Empty description.") {
                        emptyerror.classList.remove('hidden');
                    }
                    if (result.errors[i].msg === "Description must be between 5-300 characters.") {
                        lengtherror.classList.remove('hidden');
                    }
                }
            }
            else {
                    commentscount.innerText = (Number(commentscount.innerText) + 1) + '';
                    emptyerror.classList.add('hidden');
                    lengtherror.classList.add('hidden');
                    commentformtextarea.value = '';
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
                    link.setAttribute("href", `/comments/${result.comment[0].id}`);
                    const h4 = document.createElement('h4');
                    h4.classList.add("et_pb_module_header");
                    h4.innerText = result.comment[0].description;
                    const div4 = document.createElement('div');
                    div4.classList.add("et_pb_blurb_description");
                    const link2 = document.createElement('a');
                    link2.setAttribute("href", `/users/${result.comment[0].userid}`);
                    const h42 = document.createElement('h4');
                    h42.classList.add("et_pb_module_header");
                    h42.innerText = result.comment[0].username;
                    const p = document.createElement('p');
                    const str = document.createElement('strong');
                    str.innerText = moment(result.comment[0].datecreated).format('LLL');
                    div.appendChild(div2);
                    div2.appendChild(div3);
                    div3.appendChild(link);
                    link.appendChild(h4);
                    div3.appendChild(div4);
                    div4.appendChild(link2);
                    link2.appendChild(h42);
                    div4.appendChild(p);
                    p.appendChild(str);
                    container.insertBefore(div, container.firstChild);
                }
            });
        });
