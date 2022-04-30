const btnNext = document.getElementById("next");
const btnRun = document.getElementById("run");
const btnCompile = document.getElementById("compile");

let stack = [];
let idx = 0;
let index = 0;
let str = "";
let curr = 0;
let children = [];
let list = [];
let memory = {};

let program = `
  print 1+2+3+4+5+6+7+8+9+200;
  print "end";
`;

reset();

function reset() {
  const text = document.querySelector("textarea").value;
  program = text;
  stack = [];
  idx = 0;
  index = 0;
  str = "";
  curr = 0;
  children = [];
  list = [];
  memory = {};

  document.querySelector(".console-output").innerHTML = "<p>program output</p>";
  document.querySelector(".program-stack").innerHTML = "<p>program stack</p>";

  for (let i = 0; i < program.length; i++)
    if (program[i] !== " " && program[i] !== "\n") {
      if (program[i] === '"') {
        str += program[i++];
        while (i < program.length && program[i] !== '"') str += program[i++];
        str += program[i];
      } else str += program[i];
    }

  while (curr < str.length) {
    children.push(statement());
  }

  for (let i = 0; i < children.length; i++) traverse(children[i]);
  if (list.length) list.push(Node(END, END));

  simple_chart_config.nodeStructure = {
    text: { name: "program" },
    hideRootNode: true,
    connectors: {
      type: "step",
      style: {
        cursor: "pointer",
      },
    },

    children: [...children],
  };

  new Treant(
    simple_chart_config,
    function () {
      console.log("Tree Loaded");
    },
    $
  );

  printAll(list, stack, memory);
}

btnCompile.addEventListener("click", reset);
btnNext.addEventListener("click", runNext);
btnRun.addEventListener("click", () => {
  while (index < list.length) runNext();
});

function traverse(node) {
  if (!node) return 0;
  if (node.text.type === IF) {
    const [condition, thenBranch, elseBranch] = node.children;
    const elseIndex = count(thenBranch) + 2;
    const endIndex = count(elseBranch) + 1;

    traverse(condition);
    list.push({ type: JUMP, n: elseIndex });
    traverse(thenBranch);
    list.push({ type: JUMP, n: endIndex });
    traverse(elseBranch);
  } else if (node.text.type === WHILE) {
    const [condition, thenBranch] = node.children;
    const elseIndex = count(thenBranch) + 2;
    const conditionCount = count(condition) + elseIndex - 1;
    traverse(condition);
    list.push({ type: JUMP, n: elseIndex });
    traverse(thenBranch);
    list.push({ type: JUMP, n: -conditionCount });
  } else {
    for (let i = 0; i < node.children.length; i++) {
      const element = node.children[i];
      traverse(element);
    }
    if (![ELSE, THEN].includes(node.text.type)) {
      list.push(node);
    }
  }
}

function count(node) {
  if (!node) return 0;
  let c = ![ELSE, THEN].includes(node.text.type) ? 1 : 0;
  c += node.text.type === IF ? 1 : 0;
  c += node.text.type === WHILE ? 1 : 0;

  for (let i = 0; i < node.children.length; i++) {
    const element = node.children[i];
    c += count(element);
  }

  return c;
}

function runNext() {
  let flag = false;
  if (index >= list.length) return;

  printAll(list, stack, memory);
  if (list[index].type === JUMP) {
    index += list[index].n;
    return;
  }

  const { desc: idx, type, name } = list[index].text;
  const elements = document.querySelectorAll(".node-desc");

  switch (type) {
    case LITERAL:
      stack.push(parseInt(name));
      break;
    case SET:
    case LITERAL_S:
      stack.push(name);
      break;
    case IDENTIFIER:
      stack.push(memory[name]);
      break;
    case PRINT: {
      const value = stack.pop();
      printToConsole(value);
      break;
    }
    case EXPR_STMT:
      stack.pop();
      break;
    case DECLARATION: {
      const value = stack.pop();
      const identifier = stack.pop();
      memory[identifier] = value;
      console.log(memory);
      break;
    }
    case ASSIGMENT: {
      const value = stack.pop();
      const identifier = stack.pop();
      memory[identifier] = value;
      stack.push(value);
      break;
    }
    case BINARY: {
      const b = stack.pop();
      const a = stack.pop();

      if (name === "+") stack.push(a + b);
      else if (name === "-") stack.push(a - b);
      else if (name === "*") stack.push(a * b);
      else stack.push(a / b);
      break;
    }
    case COMPARASION: {
      const b = stack.pop();
      const a = stack.pop();
      if (name === ">") stack.push(a > b);
      else stack.push(a < b);
      break;
    }
    case UNARY: {
      const a = stack.pop();
      if (name === "+") stack.push(a);
      else stack.push(-a);
      break;
    }
    case CONDITION: {
      if (stack.pop()) {
        index += 2;
      } else {
        index += list[index + 1].n + 1;
      }

      flag = true;
      break;
    }
    case END:
      index++;
      return;
    default:
      alert(`unknown instruction ${type}.`);
  }

  printAll(list, stack, memory);

  if (index >= list.length) return;

  for (const element of elements) {
    if (element.textContent == idx) {
      element.previousElementSibling.classList.remove("node-name");
      element.previousElementSibling.classList.add("node-name1");
    }
  }

  if (flag) return;

  index++;
}

function statement() {
  if (str[curr] === "i") return ifStmt();
  else if (str[curr] === "{") return block();
  else if (str[curr] === "p") {
    curr += 5;
    const printStmt = Node(PRINT, PRINT);

    printStmt.children.push(parseExpression());

    curr++;
    return printStmt;
  } else if (str[curr] === "v") {
    curr += 3;
    const declaration = Node(DECLARATION, DECLARATION);
    const identifier = declarationIdentifier();
    curr++;
    const expression = parseExpression();
    curr++;
    declaration.children.push(identifier);
    declaration.children.push(expression);

    return declaration;
  } else if (str[curr] === "w") return whileStmt();
  else {
    const exprStmt = Node("exprStmt", "exprStmt");
    exprStmt.children.push(parseExpression());
    curr++;
    return exprStmt;
  }
}

function declarationIdentifier() {
  let identifier = "";
  while (curr < str.length && (isLetter(str[curr]) || isNum(str[curr]))) {
    identifier += str[curr++];
  }

  return Node(identifier, SET);
}

function block() {
  curr++;
  const list = [];
  while (str[curr] !== "}") {
    list.push(statement());
  }
  curr++;
  return list;
}

function whileStmt() {
  curr += 6;
  const expression = parseExpression();
  const parent = Node(WHILE, WHILE);
  const condition = Node(CONDITION, CONDITION);
  const thenBranch = Node(THEN, THEN);
  curr++;

  condition.children.push(expression);
  const thenBody = statement();

  if (thenBody.length) thenBranch.children = thenBody;
  else thenBranch.children.push(thenBody);

  parent.children.push(condition);
  parent.children.push(thenBranch);

  return parent;
}

function ifStmt() {
  curr += 3;
  const expression = parseExpression();
  const parent = Node(IF, IF);
  const condition = Node(CONDITION, CONDITION);
  const thenBranch = Node(THEN, THEN);
  const elseBranch = Node(ELSE, ELSE);
  curr++;

  condition.children.push(expression);
  const thenBody = statement();

  if (thenBody.length) thenBranch.children = thenBody;
  else thenBranch.children.push(thenBody);

  parent.children.push(condition);
  parent.children.push(thenBranch);

  if (str[curr] === "e") {
    curr += 4;
    const elseBody = statement();
    if (elseBody.length) elseBranch.children = elseBody;
    else elseBranch.children.push(elseBody);
    parent.children.push(elseBranch);
  }

  return parent;
}

function isNum(s) {
  return s >= "0" && s <= "9";
}

function checkAssigment() {
  let i = curr;

  while (i < str.length && (isLetter(str[i]) || isNum(str[i]))) {
    i++;
  }

  return str[i] === "=";
}

function parseExpression() {
  return assigment();
}

function assigment() {
  if (checkAssigment()) {
    const declaration = Node(ASSIGMENT, ASSIGMENT);
    const identifier = declarationIdentifier();
    curr++;
    const expression = assigment();

    declaration.children.push(identifier);
    declaration.children.push(expression);

    return declaration;
  }
  return comparasion();
}

function comparasion() {
  let left = term();

  while (str[curr] === "<" || str[curr] === ">") {
    let sign = str[curr];
    const parent = Node(sign, COMPARASION);

    curr++;
    let right = term();

    parent.children.push(left);
    parent.children.push(right);

    left = parent;
  }

  return left;
}

function term() {
  let left = factor();

  while (str[curr] === "+" || str[curr] === "-") {
    let sign = str[curr];
    const parent = Node(sign, BINARY);

    curr++;
    let right = factor();

    parent.children.push(left);
    parent.children.push(right);

    left = parent;
  }

  return left;
}

function factor() {
  let left = unary();

  while (str[curr] === "*" || str[curr] === "/") {
    let sign = str[curr];
    const parent = Node(sign, BINARY);

    curr++;
    let right = unary();

    parent.children.push(left);
    parent.children.push(right);

    left = parent;
  }

  return left;
}

function unary() {
  if (str[curr] === "-") {
    const parent = Node("-", UNARY);
    curr++;
    const left = unary();
    parent.children.push(left);
    return parent;
  } else if (str[curr] === "+") {
    const parent = Node("+", UNARY);
    curr++;
    const left = unary();
    parent.children.push(left);
    return parent;
  }

  return primary();
}

function primary() {
  if (str[curr] === "(") {
    curr++;
    let val = parseExpression();
    curr++;
    return val;
  } else if (str[curr] === '"') {
    curr++;
    let newStr = "";
    while (curr < str.length && str[curr] !== '"') {
      newStr += str[curr++];
    }

    curr++;
    return Node(newStr, LITERAL_S);
  } else if (str[curr] >= "0" && str[curr] <= "9") {
    let num = "";

    while (curr < str.length && str[curr] >= "0" && str[curr] <= "9") {
      num += str[curr++];
    }

    return Node(num, LITERAL);
  }

  let identifier = "";
  while (curr < str.length && (isLetter(str[curr]) || isNum(str[curr]))) {
    identifier += str[curr++];
  }

  return Node(identifier, IDENTIFIER);
}

function isLetter(c) {
  return c.toLowerCase() != c.toUpperCase();
}

function Node(val, type) {
  return {
    text: { name: val, desc: idx++, type: type || "" },

    children: [],
  };
}

function ParentNode(sign) {
  return {
    nodeStructure: {
      text: { name: sign },
      hideRootNode: true,
      connectors: {
        type: "step",
        style: {
          cursor: "pointer",
        },
      },

      children: [],
    },
  };
}
