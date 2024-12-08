import inquirer from "inquirer";


app_process();

function app_process() {
    inquirer.prompt([
        {
            type: "rawlist",
            name: "options",
            message: "What would you like to do?",
            choices: ["Add liquidity", "Swap tokens", "View pool status", "View account balance", "Exit"]
        }
    ]).then(function(answer) {
        switch (answer.options) {
            case "Add liquidity":
                addLiquidity();
                break;
            case "Swap tokens":
                swapTokens();
                break;
            case "View pool status":
                viewPoolStatus();
                break;
            case "View account balance":
                viewAccountBalance();
                break;
            case "Exit":
                exit_app(); // In case if needed later
                break;
        }});
}

function addLiquidity() {
    // Code
    app_process();
}
function swapTokens() {
    // Code
    app_process();
}
function viewPoolStatus() {
    // Code
    app_process();
}
function viewAccountBalance() {
    // Code
    app_process();
}
function exit_app() {}