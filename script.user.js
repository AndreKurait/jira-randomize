// ==UserScript==
// @name         JIRA Board Randomize Swimlanes
// @version      2.1
// @description  Add a Randomize button to JIRA board.
// @author       https://github.com/clintonmonk
// @match        https://*.atlassian.net/jira/software/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @require      https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js
// @grant        none
// @updateURL    https://raw.githubusercontent.com/AndreKurait/jira-randomize/main/script.user.js
// @downloadURL  https://raw.githubusercontent.com/AndreKurait/jira-randomize/main/script.user.js
// @supportURL   https://github.com/AndreKurait/jira-randomize/issues
// ==/UserScript==

(function() {
    'use strict';

    const loadFontAwesome = () => {
        const link = document.createElement('link');
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    };

    const isUnassignedSwimlane = (swimlane) => {
        const result = Array.from(swimlane.querySelectorAll("div"))
            .reduce((acc, childDiv) => acc || childDiv.textContent === "Unassigned", false);
        return result;
    };

    const randomizeSwimlanes = () => {
        const swimlanes = Array.from(document.querySelectorAll("div[data-testid='platform-board-kit.ui.swimlane.swimlane-wrapper']"));
        if (swimlanes.length === 0) {
            console.error("No swimlanes found!");
            return;
        }

        const parentElement = swimlanes[0].parentElement;
        if (!parentElement) {
            console.error("Parent element of swimlanes not found!");
            return;
        }

        const [assignedSwimlanes, unassignedSwimlanes] = _.partition(swimlanes, (swimlane) => !isUnassignedSwimlane(swimlane));
        const shuffledSwimlanes = _.shuffle(assignedSwimlanes).concat(unassignedSwimlanes);

        shuffledSwimlanes.forEach((swimlane) => {
            swimlane.style.position = '';
            swimlane.style.top = '';
        });

        parentElement.innerHTML = '';

        shuffledSwimlanes.forEach(swimlane => parentElement.appendChild(swimlane));
    };

    const randomizeSwimlanesMultipleTimes = (remaining) => {
        randomizeSwimlanes();
        if (remaining > 0) {
            let timeout;
            if (remaining <= 1) {
                timeout = 370;
            } else if (remaining <= 3) {
                timeout = 200;
            } else if (remaining <= 5) {
                timeout = 90;
            } else {
                timeout = 50;
            }
            setTimeout(() => { randomizeSwimlanesMultipleTimes(remaining - 1) }, timeout);
        }
    };

    const addRandomizeButton = (insightButton, isMinimized) => {
        const insightInnerDiv = insightButton.parentElement;
        const insightOuterDiv = insightInnerDiv.parentElement;

        const button = document.createElement("button");
        button.onclick = () => { randomizeSwimlanesMultipleTimes(10) };
        button.className = insightButton.className;

        if (isMinimized) {
            button.innerHTML = '<i class="fas fa-random"></i>';
            button.setAttribute('style', 'color: var(--ds-icon, #42526E) !important;');
            button.style.fontSize = '18px';
            button.style.display = 'flex';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';
            button.style.width = '32px';
            button.style.height = '32px';
        } else {
            button.innerHTML = "Randomize";
        }

        const innerDiv = document.createElement("div");
        innerDiv.className = insightInnerDiv.className;
        innerDiv.appendChild(button);

        const outerDiv = document.createElement("div");
        outerDiv.className = insightOuterDiv.className;
        outerDiv.appendChild(innerDiv);

        const insightsParent = insightOuterDiv.parentElement.parentElement;
        const parentNode = insightsParent.parentElement;
        parentNode.insertBefore(outerDiv, insightsParent);
    };

    const findAndAddRandomizeButtons = () => {
        const insightsFullButton = document.querySelector("button[data-testid='insights-show-insights-button.ui.insights-button']");
        const insightsMinimizedButton = document.querySelector("button[data-testid='insights-show-insights-button.ui.button-test-id-hide']");

        if (insightsFullButton) {
            addRandomizeButton(insightsFullButton, false);
        }
        if (insightsMinimizedButton) {
            addRandomizeButton(insightsMinimizedButton, true);
        }

        if (!insightsFullButton && !insightsMinimizedButton) {
            console.error("No Insights button found!");
            alert("No Insights button found!");
        }
    };

    const waitForInsightsButton = (callback, timeRemaining) => {
        const interval = 200;
        const insightButton = document.querySelector("button[data-testid='insights-show-insights-button.ui.insights-button']");
        const minimizedInsightButton = document.querySelector("button[data-testid='insights-show-insights-button.ui.button-test-id-hide']");
        if (insightButton || minimizedInsightButton) {
            callback();
        } else if (timeRemaining <= 0) {
            alert("Insights button not found!");
            console.error("Insights button not found after waiting.");
        } else {
            setTimeout(() => { waitForInsightsButton(callback, timeRemaining - interval) }, interval);
        }
    };

    const extractPath = (url) => {
        const urlObj = new URL(url);
        return urlObj.origin + urlObj.pathname;
    };

    const runScript = () => {
        const url = extractPath(window.location.href);
        if (!/\/boards\/\d+(\/)?$/.test(url)) {
            console.log(`Not proceeding since window href was ${url} and did not match /\/boards\/\d+(\/)?$/`);
        } else {
            console.log(`Proceeding since window href was ${url} matched /\/boards\/\d+(\/)?$/`);
            loadFontAwesome();
            waitForInsightsButton(findAndAddRandomizeButtons, 2000);
        }
    };


    const observeUrlChanges = () => {
        let lastUrl = extractPath(location.href);
        new MutationObserver(() => {
            const currentUrl = extractPath(location.href);
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                runScript();
            }
        }).observe(document, { subtree: true, childList: true });
    };
    runScript();
    observeUrlChanges();
})();
