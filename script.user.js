// ==UserScript==
// @name         JIRA Board Randomize Swimlanes
// @version      1.1
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

    window.onload = function() {
        console.log("Window loaded, starting script...");

        /**
         * Whether or not the provided swimlane is the "Unassigned" swimlane.
         */
        const isUnassignedSwimlane = (swimlane) => {
            console.log("Checking if swimlane is unassigned...", swimlane);
            const result = Array.from(swimlane.querySelectorAll("div"))
                .reduce(
                    (acc, childDiv) => acc || childDiv.textContent == "Unassigned",
                    false,
                );
            console.log("Is unassigned swimlane:", result);
            return result;
        }

        /**
         * Randomizes the order of the swimlanes. Keeps "Unassigned" at the end.
         */
        const randomizeSwimlanes = () => {
            console.log("Randomizing swimlanes...");

            // get swimlanes
            const swimlanes = Array.from(document.querySelectorAll("div[data-test-id='platform-board-kit.ui.swimlane.swimlane-wrapper']"));
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

            // randomize using lodash
            const randomizedSwimlanes = _.partition(swimlanes, (swimlane) => { return !isUnassignedSwimlane(swimlane) })
                .map((swimlanes) => {
                    console.log("Swimlanes before shuffling:", swimlanes);
                    const shuffled = _.shuffle(swimlanes);
                    console.log("Swimlanes after shuffling:", shuffled);
                    return shuffled;
                })
                .flat();

            console.log("Randomized swimlanes:", randomizedSwimlanes);

            // add to DOM
            const frag = document.createDocumentFragment();
            randomizedSwimlanes.forEach(swimlane => frag.appendChild(swimlane));
            parentElement.appendChild(frag);

            console.log("Swimlanes appended to parent element.");
        }

        /**
         * Randomizes a given number of times (for fun!).
         */
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

        /**
         * Find Insights button.
         */
        const findInsightsButton = () => {
            console.log("Finding Insights button...");
            const insightButton = document.querySelector("button[data-testid='insights-show-insights-button.ui.insights-button']");
            console.log("Found Insights button:", insightButton);
            return insightButton;
        }

        /**
         * Adds a "Randomize" button.
         */
        const addRandomizeButton = () => {
            console.log("Adding Randomize button...");

            // copy the Insights button
            const insightButton = findInsightsButton();
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
            button.innerHTML = "Randomize";

            const innerDiv = document.createElement("div");
            innerDiv.className = insightInnerDiv.className;
            innerDiv.appendChild(button);

            const outerDiv = document.createElement("div");
            outerDiv.className = insightOuterDiv.className;
            outerDiv.appendChild(innerDiv);

            // add to DOM right before the Insights button
            const parentNode = insightOuterDiv.parentElement;
            if (!parentNode) {
                console.error("Parent node of insight outer div not found!");
                return;
            }
            parentNode.insertBefore(outerDiv, insightOuterDiv);

            console.log("Randomize button added!");
        }

        const waitForInsightsButton = (callback, timeRemaining) => {
            console.log("Waiting for Insights button... Time remaining:", timeRemaining);
            const interval = 200;
            const insightButton = findInsightsButton();
            if (insightButton) {
                callback();
            } else if (timeRemaining <= 0) {
                alert("Insight button not found!");
                console.error("Insight button not found after waiting.");
            } else {
                setTimeout(() => { waitForInsightsButton(callback, timeRemaining - interval) }, interval);
            }
        }

        waitForInsightsButton(addRandomizeButton, 2000);
    };
})();
