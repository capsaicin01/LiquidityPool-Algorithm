import inquirer from "inquirer";
import fs from 'fs/promises';
import path from 'path';

// Getter 
async function getPoolData() {
    try {
        const data = await fs.readFile('data.json', 'utf8');
        const jsonData = JSON.parse(data);
        return jsonData.pool;
    } catch (error) {
        console.error('Error reading pool data:', error);
        return null;
    }
}

async function getUserBalance() {
    try {
        const data = await fs.readFile('data.json', 'utf8');
        const jsonData = JSON.parse(data);
        return jsonData.userBalance;
    } catch (error) {
        console.error('Error reading user balance:', error);
        return null;
    }
}

// Setter 
async function updatePoolData(newPoolData) {
    try {
        const data = await fs.readFile('data.json', 'utf8');
        const jsonData = JSON.parse(data);
        jsonData.pool = { ...jsonData.pool, ...newPoolData };
        await fs.writeFile('data.json', JSON.stringify(jsonData, null, 4));
        return true;
    } catch (error) {
        console.error('Error updating pool data:', error);
        return false;
    }
}

async function updateUserBalance(newBalance) {
    try {
        const data = await fs.readFile('data.json', 'utf8');
        const jsonData = JSON.parse(data);
        jsonData.userBalance = { ...jsonData.userBalance, ...newBalance };
        await fs.writeFile('data.json', JSON.stringify(jsonData, null, 4));
        return true;
    } catch (error) {
        console.error('Error updating user balance:', error);
        return false;
    }
}


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
                exit_app();
                break;
        }});
}

async function viewPoolStatus() {
    const poolData = await getPoolData();
    if (poolData) {
        console.log('\nPool Status:');
        console.log('Token A:', poolData.tokenA);
        console.log('Token B:', poolData.tokenB);
        console.log('K:', poolData.K);
    }
    app_process();
}

async function viewAccountBalance() {
    const balance = await getUserBalance();
    if (balance) {
        console.log('\nAccount Balance:');
        console.log('Token A:', balance.tokenA);
        console.log('Token B:', balance.tokenB);
    }
    app_process();
}

async function addLiquidity() {
    const poolStatus = await getPoolData();

    inquirer.prompt([
        {
            type: "list",
            name: "inputType",
            message: "Select which currency to deposit first: ",
            choices: ["tokenA", "tokenB"]
        },
        {
            type: "number",
            name: "firstAmount",
            message: "How much do you want to deposit: ",
            validate: function(value) {
                if (value <= 0) {
                    return "Please enter a valid amount.";
                }
                return true;
            }
        }
    ]).then(async function (answers) {
        const isTokenA = answers.inputType === "tokenA";
        const firstAmount = answers.firstAmount;
        const secondAmount = isTokenA ? (firstAmount / poolStatus.tokenA) * poolStatus.tokenB : (firstAmount / poolStatus.tokenB) * poolStatus.tokenA;
        const formatOrder = isTokenA ? ["tokenA", "tokenB"] : ["tokenB", "tokenA"];

        console.log(`In order to deposit ${firstAmount} ${formatOrder[0]}, you need to also deposit ${secondAmount} ${formatOrder[1]}.`)
        inquirer.prompt([
            {
                type: "confirm",
                name: "confirmation",
                message: "Do you confirm?"
            }
        ]).then(async function(answer) {
            if (answer.confirmation) {
                const userBalance = await getUserBalance();

                const newPoolValues = {
                    tokenA: isTokenA ? poolStatus.tokenA + firstAmount : poolStatus.tokenA + secondAmount,
                    tokenB: isTokenA ? poolStatus.tokenB + secondAmount: poolStatus.tokenB + firstAmount,
                }
                newPoolValues.K = newPoolValues.tokenA * newPoolValues.tokenB;

                const newUserBalance = {
                    tokenA: isTokenA ? userBalance.tokenA + firstAmount : userBalance.tokenA + secondAmount,
                    tokenB: isTokenA ? userBalance.tokenB + secondAmount : userBalance.tokenB + firstAmount
                }
            
                await updatePoolData(newPoolValues);
                await updateUserBalance(newUserBalance);

                console.log("Deposition successful.");
                return app_process();
            }else {
                console.log("Deposition cancelled.");
                return app_process();
            }
        })
    })
}

function calculateOutputAmount(inputAmount, inputReserve, outputReserve) {
    const numerator = inputAmount * outputReserve;
    const denominator = inputReserve + inputAmount;
    return Math.floor(numerator / denominator);
}

async function swapTokens() {
    const userBalance = await getUserBalance();
    const poolData = await getPoolData();
    
    if (!userBalance || !poolData) {
        console.log('Error: Could not fetch data');
        return app_process();
    }

    const initialK = poolData.tokenA * poolData.tokenB;

    inquirer.prompt([
        {
            type: 'list',
            name: 'swapDirection',
            message: 'Choose swap direction:',
            choices: [
                'Token A → Token B',
                'Token B → Token A'
            ]
        },
        {
            type: 'number',
            name: 'amount',
            message: 'Enter amount to swap:',
            validate: function(value) {
                if (value <= 0) {
                    return 'Please enter an amount';
                }
                return true;
            }
        }
    ]).then(async function(answers) {
        const isAtoB = answers.swapDirection === 'Token A → Token B';
        const inputAmount = answers.amount;

        if (isAtoB && userBalance.tokenA < inputAmount) {
            console.log('\nInsufficient Token A balance');
            return app_process();
        } else if (!isAtoB && userBalance.tokenB < inputAmount) {
            console.log('\nInsufficient Token B balance');
            return app_process();
        }

        const outputAmount = isAtoB 
            ? calculateOutputAmount(inputAmount, poolData.tokenA, poolData.tokenB)
            : calculateOutputAmount(inputAmount, poolData.tokenB, poolData.tokenA);
        
        console.log('\nSwap Preview:');
        console.log(`Input: ${inputAmount} ${isAtoB ? 'Token A' : 'Token B'}`);
        console.log(`Output: ${outputAmount} ${isAtoB ? 'Token B' : 'Token A'}`);
        
        const newTokenA = isAtoB ? poolData.tokenA + inputAmount : poolData.tokenA - outputAmount;
        const newTokenB = isAtoB ? poolData.tokenB - outputAmount : poolData.tokenB + inputAmount;

        const confirmation = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'proceed',
                message: 'Do you want to proceed with this swap?',
                default: false
            }
        ]);

        if (!confirmation.proceed) {
            console.log('\nSwap cancelled');
            return app_process();
        }

       
        const newUserBalance = {
            tokenA: isAtoB 
                ? userBalance.tokenA - inputAmount 
                : userBalance.tokenA + outputAmount,
            tokenB: isAtoB 
                ? userBalance.tokenB + outputAmount 
                : userBalance.tokenB - inputAmount
        };
        
        
        const newPoolData = {
            tokenA: newTokenA,
            tokenB: newTokenB,
            K: initialK 
        };

        if (newPoolData.tokenA <= 0 || newPoolData.tokenB <= 0) {
            console.log('\nError: Swap would deplete the pool');
            return app_process();
        }

        

        await updateUserBalance(newUserBalance);
        await updatePoolData(newPoolData);

        console.log('\nSwap successful!');
        console.log(`Swapped ${inputAmount} ${isAtoB ? 'Token A' : 'Token B'} for ${outputAmount} ${isAtoB ? 'Token B' : 'Token A'}`);

        app_process();
    });
}

function exit_app() {}