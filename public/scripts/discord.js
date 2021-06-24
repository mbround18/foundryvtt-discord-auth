/**
 * Change the client ID to one from discord developer portal!
 */

const config = {
    clientId: 'changeme',
    callbackUrl: 'http://127.0.0.1:30000/join',
    compositePaths: [
        'id',
        'email'
    ]
}

/**
 *
 * ============================================================================================================
 * Utilities for this script
 * ============================================================================================================
 *
 */

/**
 *
 * @param {string} tag
 * @param {any} attributes
 * @param {Node[]} children
 * @returns {HTMLElement}
 */
function craftElement(tag, attributes, children = []) {
    const element = document.createElement(tag)
    Object.entries(attributes).forEach(
        /**
         *
         * @param {string} key
         * @param {*} value
         */
        ([key, value]) => {
            switch (key) {
                case 'innerHTML':
                    element.innerHTML = value;
                    break;
                case 'innerText':
                    element.innerText = value;
                    break;
                case 'onclick':
                    element.onclick = value;
                    break;
                case 'onkeypress':
                    element.onkeypress = value;
                    break;
                default:
                    element.setAttribute(key, value);
                    break;
            }
        }
    )
    children.forEach(child => {
        element.appendChild(child)
    })
    return element;
}

function removeEmpty(arr) {
    return arr.filter(el => {
        return el != null && el !== '';
    })
}


/**
 *
 * ============================================================================================================
 * Discord Authentication flow for /join
 * ============================================================================================================
 *
 */

/**
 * Create a series of page objects we will be working with.
 */
const loginPageObjects = {
    userId: () => document.getElementsByName('userid'),
    userIdOptions: () => document.querySelectorAll('select[name=userid] > option'),
    password: () => document.getElementsByName('password'),
    joinBtn: () => document.getElementsByName("join"),
    discordInfoContainer: () => document.getElementById("discord-info"),
    discordDisabledText: () => document.getElementById("discord-disabled-text"),
    discordLoginBtn: () => document.getElementById("discord-login-btn")
}

/**
 * Returns the join button on the page.
 * @returns {HTMLElement}
 */
function getJoinButton() {
    const {joinBtn} = loginPageObjects;
    if (!joinBtn()) {
        console.error("Failed to find join button");
    }
    return joinBtn()[0]
}

/**
 * Returns the form container.
 * @returns {HTMLElement}
 */
function getFormContainer() {
    const join = getJoinButton();
    return join.parentElement;
}

/**
 * Loads the discord information container
 * @returns {HTMLElement}
 */
function getDiscordInfoContainer() {
    const {discordInfoContainer} = loginPageObjects;
    const formContainer = getFormContainer();
    if (!discordInfoContainer()) {
        console.debug("Creating Discord Info Container")
        const textNode = document.createTextNode("Discord Authorization <3")
        formContainer.appendChild(craftElement(
            'div', { id: 'discord-info' }, [textNode])
        )
    } else {
        console.info("Found Discord Info Container");
    }
    return discordInfoContainer()
}

/**
 * Loads the discord login anchor
 * @returns {HTMLElement}
 */
function getDiscordLoginBtn() {
    const { discordLoginBtn } = loginPageObjects;
    const formContainer = getFormContainer();
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.callbackUrl)}&response_type=token&scope=identify%20connections%20email%20guilds`
    if (!discordLoginBtn()) {
        console.debug("Creating Discord Login Button")
        const textNode = document.createTextNode("Click Here to Login with Discord")
        formContainer.appendChild(craftElement('div', {
            id: 'discord-login-btn',
            target: 'self',
            onclick: ()=> window.location = discordAuthUrl
        }, [
            craftElement('img', {
                src: 'icons/discord/login-with-discord.png',
                style: 'display: block; width: 65%; margin-left: auto; margin-right: auto;'
            })
        ]))
    } else {
        console.info("Found Discord Login Button")
    }
    return discordLoginBtn()
}

/**
 * Returns the user name and user ids.
 */
function getUsers() {
    return Array.apply(null, loginPageObjects.userId()[0].options)
        .map(({ label, value }) => ({ label, value}))
        .filter(({label}) => {
            return label != null && label !== '';
        })
}

/**
 * Creates a new element to prompt for the access key
 */
function promptForAccessKey(snowflake, email) {
    const formContainer = getFormContainer();
    const {
        discordInfoContainer,
        discordLoginBtn,
        userId,
        password
    } = loginPageObjects;

    /**
     * Hide original fields
     */
    password()[0].parentElement.style = 'display: none;'

    /**
     * Setup submission
     */
    const submitCredentials = () => {
        const password = loginPageObjects.password()[0];
        const join = getJoinButton();
        const accessKey = document.getElementById('access-key').value
        const compositeKeyParts = [];
        if (config.compositePaths.includes('id')) {
            compositeKeyParts.push(snowflake)
        }
        if (config.compositePaths.includes('email')) {
            compositeKeyParts.push('email')
        }
        compositeKeyParts.push(accessKey);
        password.value = compositeKeyParts.join('+');
        join &&
        typeof join.submit ==='function' &&
        join.submit()
    }

    // Create access key input field.
    const accessKeyField = craftElement('input', {
        type: 'password',
        name: 'access-key',
        id: 'access-key',
        onkeypress: (e) => {
            if (e.keyCode === 13) {
                submitCredentials()
            }
        }
    })

    // Create Submit Button.
    const submitButton = craftElement('button', {
        id: 'discord-submit-btn',
        onclick: submitCredentials,
        innerText: 'Submit Access Key'
    });

    getJoinButton().style = "display: none;";

    formContainer.appendChild(accessKeyField)
    formContainer.appendChild(submitButton)
    discordInfoContainer().innerHTML = "✅ You have been authenticated via discord! :) <br> Please provide your access key:"
    discordLoginBtn().remove()
}

/**
 * Removes the user id select list and replaces it with a hidden input field.
 */
function setUsernameValue(userId) {
    loginPageObjects.userId()[0].parentElement.remove();
    getFormContainer()
        .appendChild(craftElement('input', {
            style: 'display: none;',
            type: 'text',
            name: 'userid',
            value: userId
        }))
}


function submitDiscordLogin(accessToken, tokenType) {
        /**
         * Hides the join button.
         */
        const join = getJoinButton();
        console.debug("Hiding join button");
        join.setAttribute("type", "submit")

        console.debug("Fetching discord information about user.");
        return fetch('https://discord.com/api/users/@me', {
            headers: {
                authorization: `${tokenType} ${accessToken}`,
            },
        })
            .then(result => result.json())
            .then(response => {
                /**
                 * Display error if user not found or prompts for access key.
                 */
                const { username, discriminator, id, email } = response;
                const users = getUsers();
                const infoContainer = getDiscordInfoContainer();
                infoContainer.textContent = "Processing...";
                const userId = `${username}#${discriminator}`;
                const foundUser = users.find(user => user.label === userId)
                if (!foundUser) {
                    infoContainer.textContent = `Woah! Sorry ${userId} but you dont have access to this server!`;
                } else {
                    setUsernameValue(foundUser.value);
                    promptForAccessKey(id, email);
                }
            })
            .catch((...e) => {
                const infoContainer = getDiscordInfoContainer();
                infoContainer.innerText = "Failed to authenticate user!"
                console.error(...e);
            });
}

/**
 * Our discord flow :)
 */
function discordFlow() {
    /**
     * Load Discord Elements
     */
    getDiscordLoginBtn()
    getDiscordInfoContainer()


    /**
     * Checks for existing discord information
     */
    const storageAccessToken = localStorage.getItem('discord-access-token')
    const storageAccessType = localStorage.getItem('discord-access-type')
    submitDiscordLogin(storageAccessToken, storageAccessType)
        .catch(() => {
            const infoContainer = getDiscordInfoContainer();
            infoContainer.textContent = "No existing Discord auth data found! Try clicking the Discord login button! :)"
        })



    /**
     * Checks for access_token and token_type on the route params.
     */
    console.debug("Displaying discord authentication information.");
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const [accessToken, tokenType] = [fragment.get('access_token'), fragment.get('token_type')];

    if (accessToken, tokenType) {
        submitDiscordLogin(accessToken, tokenType)
            .then(() => {
                localStorage.setItem('discord-access-token', accessToken);
                localStorage.setItem('discord-access-type', tokenType);
            })
    }
}

/**
 *
 * ============================================================================================================
 * Discord Players flow for /players
 * ============================================================================================================
 *
 */

function createAdditionalCols() {
    /**
     * Remove Password Field
     */
    const rows = document.querySelectorAll('li.player');
    rows.forEach(row => {
        const [, password, role] = row.querySelectorAll('div.form-group');
        password.style = 'display: none;'
        const userId = row.getAttribute('data-user-id');
        const compositeFields = document.querySelectorAll(`div[class=discord-composite-${userId}]`)
        if (compositeFields.length !== 3) {
            const fields = [];
            if (config.compositePaths.includes('id')) {
                fields.push(craftElement('input', {
                    id: `users.${userId}.discordId`,
                    type: 'number',
                    placeholder: '0'.repeat(20),
                    autocomplete: "off",
                    class: `discord-composite-${userId}`
                }))
            }
            if (config.compositePaths.includes('email')) {
                fields.push(craftElement('input', {
                    id: `users.${userId}.email`,
                    type: 'text',
                    placeholder: '*'.repeat(20),
                    autocomplete: "off",
                    class: `discord-composite-${userId}`
                }))
            }
            // Access Key
            fields.push(craftElement('input', {
                id: `users.${userId}.accessKey`,
                type: 'password',
                placeholder: '*'.repeat(20),
                autocomplete: "off",
                class: `discord-composite-${userId}`
            }))
            // Apply fields
            fields.forEach(discordEle =>
                row.insertBefore(discordEle, role)
            );
        }
    })
}

function userManagementFlow() {
    createAdditionalCols();

    /**
     * Add new columns
     */
    const [userName, passwordLabel, roleLabel] = document.querySelectorAll('#player-list li.header label')
    userName.innerHTML = "Discord UserName#0000 | User Name"
    passwordLabel.innerText = "Discord ID"
    if (config.compositePaths.includes('email')) {
        passwordLabel.parentElement.insertBefore(craftElement('label', { innerText: 'Email' }), roleLabel)
    }
    passwordLabel.parentElement.insertBefore(craftElement('label', { innerText: 'Access Key' }), roleLabel)
    if (!config.compositePaths.includes('id')) {
        passwordLabel.remove()
    }



    /**
     * Set User Management Width Larger
     */
    document.getElementById('manage-players').style = 'flex: 0 0 1000px;'


    /**
     * Modify the submit nature
     */
    const submitBtn = document.querySelector('#manage-players footer button[type=submit]')
    submitBtn.style = "display: none;"
    const newSubmitBtn = craftElement('button', {
        innerHTML: submitBtn.innerHTML,
        onclick: () => {
            const rows = document.querySelectorAll('li.player');
            rows.forEach(row => {
                const compositeAccessParts = [];
                /**
                 * @type {string}
                 */
                const userId = row.getAttribute('data-user-id');
                if (config.compositePaths.includes('id')) {
                    compositeAccessParts.push(
                        document.getElementById(`users.${userId}.discordId`).value
                    )
                }
                if (config.compositePaths.includes('email')) {
                    compositeAccessParts.push(
                        document.getElementById(`users.${userId}.email`).value
                    )
                }
                compositeAccessParts.push(
                    document.getElementById(`users.${userId}.accessKey`).value
                )
                const compositeKey = removeEmpty(compositeAccessParts).join('+')
                console.log({userId, compositeKey})
                if (!!compositeKey) {
                    console.debug("Setting password composite for", userId);
                    document.getElementsByName(`users.${userId}.password`)[0].value = compositeKey;
                } else {
                    console.debug("Skipping setting password for", userId);
                }
            })
            submitBtn.click()
            // document.getElementById('manage-players').submit()
        }
    })
    document.querySelector('#manage-players footer').appendChild(newSubmitBtn)

    /**
     * Modify the Create Additional User
     */
    const createAdditionalUserBtn = document.querySelector('#manage-players footer button[data-action=create-user]')
    createAdditionalUserBtn.style = "display: none;"
    const newCreateAdditionalUserBtn = craftElement('button', {
        innerHTML: createAdditionalUserBtn.innerHTML,
        onclick: () => {
            createAdditionalUserBtn.click()
            createAdditionalCols();
        }
    })

    document.querySelector('#manage-players footer').insertBefore(newCreateAdditionalUserBtn, document.querySelector('button[data-action="configure-permissions"]'))
}


/**
 *
 * ============================================================================================================
 * Flow Control Center
 * ============================================================================================================
 *
 */


function launchFlow(condition, flow) {
    if (!condition()) {
        setTimeout(()=>launchFlow(condition, flow), 100)
    } else {
        flow()
    }
}

switch (location.pathname) {
    case '/join':
        console.debug("Launching Player Management Discord Flow")
        launchFlow(() =>
            loginPageObjects.joinBtn().length > 0,
            discordFlow
        )
        break;
    case '/players':
        console.debug("Launching Player Management Discord Flow")
        launchFlow(() =>
            document.querySelectorAll('li.player').length > 0,
            userManagementFlow
        )
        break;
    default:
        break;
}
