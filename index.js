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

function addLiquidity() {
    // Code
    app_process();
}

async function swapTokens() {
    const userBalance = await getUserBalance();
    
    if (!userBalance) {
        console.log('Error: Could not fetch user balance');
        return app_process();
    }

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
        const amount = answers.amount;

        
        if (isAtoB && userBalance.tokenA < amount) {
            console.log('\nInsufficient Token A balance');
            return app_process();
        } else if (!isAtoB && userBalance.tokenB < amount) {
            console.log('\nInsufficient Token B balance');
            return app_process();
        }

       
        const newUserBalance = {
            tokenA: isAtoB ? userBalance.tokenA - amount : userBalance.tokenA + amount,
            tokenB: isAtoB ? userBalance.tokenB + amount : userBalance.tokenB - amount
        };
        
        
        const poolData = await getPoolData();
        const newPoolData = {
            tokenA: isAtoB ? poolData.tokenA + amount : poolData.tokenA - amount,
            tokenB: isAtoB ? poolData.tokenB - amount : poolData.tokenB + amount,
            K: poolData.K // K remains constant
        };

       
        await updateUserBalance(newUserBalance);
        await updatePoolData(newPoolData);

        console.log('\nSwap successful!');
        console.log(`Swapped ${amount} ${isAtoB ? 'Token A for Token B' : 'Token B for Token A'}`);
        app_process();
    });
}

function exit_app() {}