/** *****************************************************/
//                1. CORE UI FUNCTIONS
/** *****************************************************/

/**
 * Injects the user data into the HTML of the page
 */
function showLoggedHTML() {
    /* Switch Menu settings */
    const notLoggedElements = queryAll(".not-logged");
    for (const notLoggedElement of notLoggedElements) {
        notLoggedElement.classList.add("is-hidden");
    }
    const loggedElements = queryAll(".logged");
    for (const loggedElement of loggedElements) {
        loggedElement.classList.remove("is-hidden");
    }
}

/**
 * Hides the logged info for the user and shows the non-logged section
 */
function showUnloggedHTML() {
    /* Switch Menu settings */
    const notLoggedElements = queryAll(".not-logged");
    for (const notLoggedElement of notLoggedElements) {
        notLoggedElement.classList.remove("is-hidden");
    }
    const loggedElements = queryAll(".logged");
    for (const loggedElement of loggedElements) {
        loggedElement.classList.add("is-hidden");
    }
}

function initProfilePhotoInput() {
    const image_container = document.querySelector('.profile-img')
    const input = document.querySelector('.profile-img input')

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
        const reader = new FileReader();
    
        reader.onload = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
    
        reader.onerror = () => {
            reject(new Error('File read error.'));
        };
    
        reader.readAsDataURL(file);
        });
    }

    const inputTrigger = () => {
        input.click()
    }

    const updateUserPhoto = async (event) => {
        const file = event.target.files[0];

        try {
            const base64String = await fileToBase64(file);
            const params = {
                photoBytes: base64String,
                publish: true
            };
            console.log(params);
            gigya.accounts.setProfilePhoto({params, callback: function(response) {
                // Processing the response from the server
                if (response.errorCode === 0) {
                  console.log('Profile photo updated successfully.');
                  location.reload();
                } else {
                  console.error('Error updating account information:', response.errorMessage);
                }
              }});

        } catch (error) {
            console.error(error);
        }
    }

    image_container.addEventListener('click', inputTrigger)
    input.addEventListener('change', updateUserPhoto)
}

function hideFooterWidgets()  {
    // my function
    const widgets = document.querySelectorAll(".widget")
    widgets.forEach(item => {
        if (item.childNodes[1].childNodes[1].innerHTML === "Information") {
            item.classList.add('logged');
            item.parentNode.style = `
                justify-content: start
            `
            item.parentNode.childNodes[1].style = `
            margin-right: 30px
        `
            showUnloggedHTML()
        }
    })
}

function setInputSelect(path) {
    // my function
    return  new Promise(async (resolve, reject) => {
        await fetch(path)
            .then(response => response.json())
            .then(data => {
                // Ваш JSON теперь доступен в переменной data
                resolve(data)
            })
            .catch(error => {
                // Обработка ошибок при загрузке JSON
                console.error('Ошибка:', error);
                resolve({})
            })
    })  
}

function getProfileFormInputs() {
    // my function
    return {
        firstName: document.querySelector('#fname'),
        lastName: document.querySelector('#lname'),
        email: document.querySelector('#email'),
        company: document.querySelector('#cname'),
        country: document.querySelector('#country'),
        address: document.querySelector('#address'),
        mobile: document.querySelector('#mobile'),
    }
}

let user

async function setUserProfileForm() {
    // my function
    initProfilePhotoInput()
    async function showAccInfo(response) {
        user = response

        // Static user data
        const user_photo = document.querySelector('.profile-img img')
        const user_name = document.querySelector('.profile-img h2')
        const user_email = document.querySelector('.profile-img p')
    
        // All inputs object
        const formInputs = getProfileFormInputs()

        // Init visible user data
        user_photo.src = user.profile.photoURL
        user_name.innerHTML = `${user.profile.firstName} ${user.profile.lastName}`
        user_email.innerHTML = user.profile.email

        // Init Form
        await setInputSelect('../assets/country.json').then(result => {
            // Init country input
            for (key in result) {
                let option = document.createElement('option')
                option.innerHTML = key
                option.value = key
                if (key === user.profile.country) {
                    option.selected = true
                }
                formInputs.country.append(option)
            }
        })

        // Init other inputs
        formInputs.firstName.value = user.profile.firstName
        formInputs.lastName.value = user.profile.lastName
        formInputs.email.value = user.profile.email
        formInputs.company.value = user.profile.work ? user.profile.work.company : ''
        formInputs.address.value = user.profile.address ? user.profile.address : ''
        formInputs.mobile.value = user.profile.phones ? user.profile.phones.number : ''
    }

    gigya.accounts.getAccountInfo({extraProfileFields: 'firstName,lastName,email,country,phones,address,work,gender,birthYear,birthDay,birthMonth,samlData,locale', callback: showAccInfo})
}

function updateAccount(event) { 
    // my function
    event.preventDefault()

    if (!user) return

    const formInputs = getProfileFormInputs()
    let updated_user = {}

    function isContentModified(key, profileKey) {
        return formInputs[key].value !== user.profile[profileKey];
    }

    for (key in formInputs) {
        switch(key) {
            // Company and mobile, unlike the rest, have a different path to the key, so they have their own cases
            case 'company':
                if (user.profile.work) {
                    if (formInputs[key].value !== user.profile.work.company) {
                        console.info(`%cThe content in the ${key} has been modified.`, 'color: green; font-weight: bold;')
                        updated_user.work = {}
                        updated_user.work.company = formInputs[key].value
                    }
                    if (!formInputs[key].value) {
                        console.info(`%cNo content in the company`, 'color: orange; font-weight: bold;')
                    }
                } else {
                    if (!formInputs[key].value) {
                        console.info(`%cNo content in the work`, 'color: orange; font-weight: bold;')
                    } else {
                        updated_user.work = {}
                        updated_user.work.company = formInputs[key].value
                    }
                }
                break;
            case 'mobile':
                if (user.profile.phones) {
                    if (formInputs[key].value !== user.profile.phones.number) {
                        console.info(`%cThe content in the ${key} has been modified.`, 'color: green; font-weight: bold;')
                        updated_user.phones = {}
                        updated_user.phones.number = formInputs[key].value
                    }
                    console.log(formInputs[key].value === user.profile.phones.number);
                } else {
                    if (!formInputs[key].value) {
                        console.info(`%cNo content in the phones`, 'color: orange; font-weight: bold;')
                    } else {
                        updated_user.phones = {}
                        updated_user.phones.number = formInputs[key].value
                    }
                }
                break;
            default:
                if (key !== 'company' && key !== 'mobile') {
                    if (user.profile[key]) {
                        if (isContentModified(key,key)) {
                            console.info(`%cThe content in the ${key} has been modified.`, 'color: green; font-weight: bold;')
                            updated_user[key] = formInputs[key].value
                        }
                    } else {
                        if (!formInputs[key].value) {
                            console.info(`%cNo content in the ${key}`, 'color: orange; font-weight: bold;')
                        } else {
                            updated_user[key] = formInputs[key].value
                        }
                    }
                }
        }
    }

    let idsParams = {
        profile: updated_user
    }

    if (Object.keys(idsParams.profile).length <= 0) return

    gigya.ids.setAccountInfo({
        ...idsParams,
        callback: function(response) {
          // Processing the response from the server
          if (response.errorCode === 0) {
            console.log('Account information updated successfully.');
            location.reload();
          } else {
            console.error('Error updating account information:', response.errorMessage);
          }
        }
    });
}

/**
 * Goes to the home page (defined in parameter 'main_url' inside config/site.json)
 */
function gotoHome() {
    // my function
    window.location.href = window.location.origin + "/index.html";
}

function logout(event) {
    // my function
    event.preventDefault()
    logoutWithRaaS(gotoHome());
}