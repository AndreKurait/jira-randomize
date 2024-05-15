// ==UserScript==
// @name         JIRA Board Randomize Swimlanes
// @version      2
// @description  Add a Randomize button to JIRA board.
// @author       https://github.com/clintonmonk
// @match        https://*.atlassian.net/jira/software/c/projects/*/boards/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @require      https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js
// @grant        none
// @updateURL    https://raw.githubusercontent.com/AndreKurait/jira-randomize/main/script.user.js
// @downloadURL  https://raw.githubusercontent.com/AndreKurait/jira-randomize/main/script.user.js
// @supportURL   https://github.com/AndreKurait/jira-randomize/issues
// ==/UserScript==

(function() {
    'use strict';

    // Function to load FontAwesome CSS dynamically
    const loadFontAwesome = () => {
        const link = document.createElement('link');
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    };

    // Call the function to load FontAwesome
    loadFontAwesome();

    window.onload = function() {
        console.log("Window loaded, starting script...");

        const isUnassignedSwimlane = (swimlane) => {
            console.log("Checking if swimlane is unassigned...", swimlane);
            const result = Array.from(swimlane.querySelectorAll("div"))
                .reduce(
                    (acc, childDiv) => acc || childDiv.textContent === "Unassigned",
                    false,
                );
            console.log("Is unassigned swimlane:", result);
            return result;
        }

        const randomizeSwimlanes = () => {
            console.log("Randomizing swimlanes...");

            const swimlanes = Array.from(document.querySelectorAll("div[data-testid='platform-board-kit.ui.swimlane.swimlane-wrapper']"));
            if (swimlanes.length === 0) {
                console.error("No swimlanes found!");
                return;
            }
            console.log("Found swimlanes:", swimlanes);

            const parentElement = swimlanes[0].parentElement;
            if (!parentElement) {
                console.error("Parent element of swimlanes not found!");
                return;
            }

            const [assignedSwimlanes, unassignedSwimlanes] = _.partition(swimlanes, (swimlane) => !isUnassignedSwimlane(swimlane));
            const shuffledSwimlanes = _.shuffle(assignedSwimlanes).concat(unassignedSwimlanes);

            console.log("Shuffled swimlanes:", shuffledSwimlanes);

            shuffledSwimlanes.forEach((swimlane) => {
                swimlane.style.position = '';
                swimlane.style.top = '';
            });

            parentElement.innerHTML = '';

            shuffledSwimlanes.forEach(swimlane => parentElement.appendChild(swimlane));

            console.log("Swimlanes appended to parent element with updated positions.");
        }

        const randomizeSwimlanesMultipleTimes = (remaining) => {
            console.log("Randomizing swimlanes multiple times. Remaining:", remaining);
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

                console.log("Next randomization in", timeout, "ms");

                setTimeout(
                    () => { randomizeSwimlanesMultipleTimes(remaining - 1) },
                    timeout
                );
            }
        }

        const addRandomizeButton = (insightButton, isMinimized) => {
            console.log("Adding Randomize button...");

            if (!insightButton) {
                console.error("Insights button not found, cannot add Randomize button.");
                return;
            }

            const insightInnerDiv = insightButton.parentElement;
            if (!insightInnerDiv) {
                console.error("Insight inner div not found!");
                return;
            }
            const insightOuterDiv = insightInnerDiv.parentElement;
            if (!insightOuterDiv) {
                console.error("Insight outer div not found!");
                return;
            }

            const button = document.createElement("button");
            button.onclick = () => { randomizeSwimlanesMultipleTimes(10) }
            button.className = insightButton.className;

            if (isMinimized) {
                button.innerHTML = '<i class="fas fa-random"></i>';
                button.style.fontSize = '18px';
                button.style.color = 'var(--ds-icon, #42526E) !important';
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
            if (!parentNode) {
                console.error("Parent node of insight outer div not found!");
                return;
            }
            parentNode.insertBefore(outerDiv, insightsParent);

            console.log("Randomize button added!");
        }

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
        }

        const waitForInsightsButton = (callback, timeRemaining) => {
            console.log("Waiting for Insights button... Time remaining:", timeRemaining);
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
        }

        waitForInsightsButton(findAndAddRandomizeButtons, 2000);
    };
})();
