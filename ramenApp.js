const Order = require("./Order");
const DRINK_PRICE = 3;

const OrderState = Object.freeze({
  WELCOMING: Symbol("welcoming"),
  MEAT: Symbol("meat"),
  SPICY: Symbol("spicy"),
  KIMCHI: Symbol("kimchi"),
  RADISH: Symbol("radish"),
  DRINK: Symbol("drink"),
  PAYMENT: Symbol("payment")
});

let meatPriceObj = {
  "chicken": 15,
  "pork": 15,
  "beef": 17,
  "vegetarian": 13
}

let sidePriceObj = {
  "kimchi": 4,
  "radish": 3
}

let inputValidationObj = {
  "meat": ["chicken", "pork", "beef", "vegetarian"],
  "kimchi": ["yes", "no"],
  "spicy": ['0', '1', '2', '3', '4', '5'], 
  "radish": ["yes", "no"]
}

function getPrice(meat, kimchi, radish, drink) {
  let meatPrice = meatPriceObj[meat.toLowerCase()];
  let sidePrice = 0;
  let drinkPrice = 0;
  if (kimchi) {
    sidePrice += sidePriceObj[kimchi.toLowerCase()];
  }
  if (radish) {
    sidePrice += sidePriceObj[radish.toLowerCase()];
  }
  if (drink) {
    drinkPrice = DRINK_PRICE;
  }
  let totalPrice = (meatPrice + sidePrice + drinkPrice) + (meatPrice + sidePrice + drinkPrice) * 0.07;
  return totalPrice;
}

function getShippingAddr(obj) {
  let tempAddr = obj.address_line_1 + ', ';
  tempAddr += obj.admin_area_2 + ', ';
  tempAddr += obj.admin_area_1 + ', ';
  tempAddr += obj.postal_code + ', ';
  tempAddr += obj.country_code;
  return tempAddr;
}

function validateInput(obj, input) {
  input = input.toLowerCase();
  if (obj.stateCur == OrderState.MEAT) {
    if (inputValidationObj["meat"].includes(input)) {
      return true;
    }
  } else if (obj.stateCur == OrderState.SPICY) {
    if (inputValidationObj["spicy"].includes(input)) {
      return true;
    }
  } else if (obj.stateCur == OrderState.KIMCHI) {
    if (inputValidationObj["kimchi"].includes(input)) {
      return true;
    }
  } else if (obj.stateCur == OrderState.RADISH) {
    if (inputValidationObj["radish"].includes(input)) {
      return true;
    }
  }
  return false;
}

module.exports = class ramenApp extends Order {
  constructor(sNumber, sUrl) {
    super(sNumber, sUrl);
    this.stateCur = OrderState.WELCOMING;
    this.sMeat = "";
    this.sSpicy = "";
    this.sKimchi = "";
    this.sRadish = "";
    this.sDrink = "";
    this.sItem = "Ramen";
    this.address = "";
    this.totalPrice = 0;
  }
  handleInput(sInput) {
    let aReturn = [];
    switch (this.stateCur) {
      case OrderState.WELCOMING:
        this.stateCur = OrderState.MEAT;
        aReturn.push("Welcome to Kim's Ramen!");
        aReturn.push("What kind of meat you want? Chicken, Pork, Beef and Vegetarian");
        break;
      case OrderState.MEAT:
        if (validateInput(this, sInput)) {
          this.stateCur = OrderState.SPICY
          this.sMeat = sInput;
          aReturn.push("How spicy do you want? Choose between 0 ~ 5");
          break;
        } else {
          this.stateCur = OrderState.MEAT;
          this.sMeat = sInput;
          aReturn.push("Sorry! Choose among Chicken, Pork, Beef and Vegetarian!");
          break;
        }
        
      case OrderState.SPICY:
        if (validateInput(this, sInput)) {
          this.stateCur = OrderState.KIMCHI
          this.sSpicy = sInput;
          aReturn.push("Do you want add Kimchi?");
          break;
        } else {
          this.stateCur = OrderState.SPICY
          this.sSpicy = sInput;
          aReturn.push("Sorry! Choose between 0 to 5!");
          break;
        }
      case OrderState.KIMCHI:
        if (validateInput(this, sInput)) {
          this.stateCur = OrderState.RADISH
          if (sInput.toLowerCase() != "no") {
            this.sKimchi = "kimchi";
          }
          aReturn.push("Do you want to add Sweet radish?");
          break;
        } else {
          this.stateCur = OrderState.KIMCHI
          aReturn.push("Sorry! Please choose Yes or No!");
          break;
        }
      case OrderState.RADISH:
        if (validateInput(this, sInput)) {
          this.stateCur = OrderState.DRINK
          if (sInput.toLowerCase() != "no") {
            this.sRadish = "radish";
          }
          aReturn.push("Would you like to have any drinks? You can say any drink name or No");
          break;
        } else {
          this.stateCur = OrderState.RADISH
          aReturn.push("Sorry! Please choose Yes or No!");
          break;
        }
      case OrderState.DRINK:
        if (sInput.toLowerCase() != "no") {
          this.sDrink = sInput;
        }
        aReturn.push("Thank-you for your order of");
        aReturn.push(`Spicy level ${this.sSpicy} : ${this.sMeat} ${this.sItem}`);
        if (this.sKimchi) {
          aReturn.push(`+ ${this.sKimchi}`);
        }
        if (this.sRadish) {
          aReturn.push(`+ ${this.sRadish}`);
        }
        if (this.sDrink) {
          aReturn.push(`Drink: ${this.sDrink}`);
        }
        this.stateCur = OrderState.PAYMENT;
        this.totalPrice = getPrice(this.sMeat, this.sKimchi, this.sRadish, this.sDrink);
        aReturn.push(`Estimated total is $${this.totalPrice} including tax`);
        aReturn.push(`Please pay for your order here`);
        aReturn.push(`${this.sUrl}/payment/${this.sNumber}/`);
        break;
      case OrderState.PAYMENT:
        console.log(sInput.purchase_units[0].shipping);
        this.address = getShippingAddr(sInput.purchase_units[0].shipping.address);
        this.isDone(true);
        let d = new Date();
        d.setMinutes(d.getMinutes() + 20);
        aReturn.push(`Your order will be delivered to "${this.address}" at ${d.toTimeString()}`);
        break;
    }
    return aReturn;
  }
  renderForm(sTitle = "-1", sAmount = "-1") {
    // your client id should be kept private
    if (sTitle != "-1") {
      this.sItem = sTitle;
    }
    if (this.totalPrice != "-1") {
      this.nOrder = this.totalPrice;
    }
    const sClientID = process.env.SB_CLIENT_ID || 'put your client id here for testing ... Make sure that you delete it before committing'
    return (`
      <!DOCTYPE html>
  
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1"> <!-- Ensures optimal rendering on mobile devices. -->
        <meta http-equiv="X-UA-Compatible" content="IE=edge" /> <!-- Optimal Internet Explorer compatibility -->
      </head>
      
      <body>
        <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
        <script
          src="https://www.paypal.com/sdk/js?client-id=${sClientID}"> // Required. Replace SB_CLIENT_ID with your sandbox client ID.
        </script>
        Thank you ${this.sNumber} for your ${this.sItem} order of $${this.nOrder}.
        <div id="paypal-button-container"></div>
  
        <script>
          paypal.Buttons({
              createOrder: function(data, actions) {
                // This function sets up the details of the transaction, including the amount and line item details.
                return actions.order.create({
                  purchase_units: [{
                    amount: {
                      value: '${this.nOrder}'
                    }
                  }]
                });
              },
              onApprove: function(data, actions) {
                // This function captures the funds from the transaction.
                return actions.order.capture().then(function(details) {
                  // This function shows a transaction success message to your buyer.
                  $.post(".", details, ()=>{
                    window.open("", "_self");
                    window.close(); 
                  });
                });
              }
          
            }).render('#paypal-button-container');
          // This function displays Smart Payment Buttons on your web page.
        </script>
      
      </body>
          
      `);

  }
}