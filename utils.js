const LITERAL = "literal";
const LITERAL_S = "literal_s";
const SET = "set";
const IDENTIFIER = "identifier";
const PRINT = "print";
const DECLARATION = "declaration";
const ASSIGMENT = "assigment";
const BINARY = "binary";
const COMPARASION = "comparasion";
const UNARY = "unary";
const CONDITION = "condition";
const JUMP = "jump";
const WHILE = "while";
const IF = "if";
const ELSE = "else";
const THEN = "then";
const EXPR_STMT = "exprStmt";
const END = "end";

function printStack(stack) {
  const dataStack = document.querySelector(".data-stack");
  dataStack.innerHTML = "<p>stack</p>";
  for (let i = 0; i < stack.length; i++)
    dataStack.innerHTML += `<p>${stack[i]}</p>`;
}

function printMemory(memory) {
  const programVariables = document.querySelector(".program-variables");
  programVariables.innerHTML = "<p>program memory</p>";
  for (const key in memory)
    programVariables.innerHTML += `<p>${key}: ${memory[key]}</p>`;
}

function printStackProgram(stack) {
  const programStack = document.querySelector(".program-stack");
  programStack.innerHTML = "<p>program stack</p>";

  for (let i = 0; i < stack.length; i++) {
    if (stack[i].type)
      programStack.innerHTML += `<p class="${
        index === i ? "selected-item" : ""
      }">${i}. jump: ${stack[i].n}</p>`;
    else
      programStack.innerHTML += `<p class="${
        index === i ? "selected-item" : ""
      }">${i}. ${stack[i].text.type}: ${stack[i].text.name}</p>`;
  }
}

function printToConsole(value) {
  const cnsl = document.querySelector(".console-output");
  cnsl.innerHTML += `<p>${value}</p>`;
}

function printAll(list, stack, memory) {
  printStackProgram(list);
  printStack(stack);
  printMemory(memory);
}
