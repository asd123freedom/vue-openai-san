const { Configuration, OpenAIApi } = require('openai');
const fs = require('fs');

const configuration = new Configuration({
    apiKey: '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',
    
});
const openai = new OpenAIApi(configuration);

const model = 'gpt-3.5-turbo';

const prompt = `
    You are an expert programmer in JavaScript and familiar with both Vue.js and San.js. Translate the Vue.js code to San.js code. Do not include \`\`\`.
    
    Example translating from Vue.js to San.js:

    Vue.js code:
    <template>
        <div>
            <h1 v-if="showTitle">{{ title }}</h1>
            <ul>
                <li v-for="item in items">{{ item }}</li>
            </ul>
        </div>
    </template>

    <script>
    export default {
        data() {
            return {
                showTitle: true,
                title: 'Welcome to my Vue.js Demo',
                items: ['Item 1', 'Item 2', 'Item 3']
            };
        }
    };
    </script>

    San.js code (no \`\`\`)::
    <template>
        <div>
            <h1 s-if="showTitle">{{ title }}</h1>
            <ul>
                <li s-for="item in items">{{ item }}</li>
            </ul>
        </div>
    </template>

    <script>
    export default {
        initData() {
            return {
                showTitle: true,
                title: 'Welcome to my Vue.js Demo',
                items: ['Item 1', 'Item 2', 'Item 3']
            };
        }
    };
    </script>
`

const system = {role: 'system', content: prompt};
const caseTodoItem = fs.readFileSync('./vue-todo-list-app-with-single-file-component/src/TodoItem.vue', 'utf-8');
const caseTodoApp = fs.readFileSync('./vue-todo-list-app-with-single-file-component/src/App.vue', 'utf-8');

const styleVueCase = `
Vue.js代码为：

<template>
    <div>
        <h1 v-if="showTitle">{{ title }}</h1>
        <ul>
            <li v-for="item in items">{{ item }}</li>
        </ul>
    </div>
</template>

<script>
export default {
    data() {
        return {
            showTitle: true,
            title: 'Welcome to my Vue.js Demo',
            items: ['Item 1', 'Item 2', 'Item 3']
        };
    }
};
</script>

<style scoped>
    div {
        widht: 100px;
    }
</style>
`

const styleSanCase = `
转换后的san.js代码为：

<template>
    <div>
        <h1 s-if="showTitle">{{ title }}</h1>
        <ul>
            <li s-for="item in items">{{ item }}</li>
        </ul>
    </div>
</template>

<script>
export default {
    initData() {
        return {
            showTitle: true,
            title: 'Welcome to my Vue.js Demo',
            items: ['Item 1', 'Item 2', 'Item 3']
        };
    }
};
</script>

<style scoped>
    div {
        widht: 100px;
    }
</style>
`

const eventVuePrevent = `
change '.prevent' to e.preventDefault in removeTodo method

<template>
  <li>
    <span>{{ todo.text }}</span>
    <button @click.prevent="$emit('remove', todo)">Remove</button>
  </li>
</template>
`

const eventSanPrevent = `

<template>
  <li>
    <span>{{ todo.text }}</span>
    <button on-click="removeTodo">Remove</button>
  </li>
</template>
<script>
    export default {
        removeTodo(e) {
            e.preventDefault();
            this.fire('remove', this.data.get('todo'))
        }
    }
</script>
`

const preventUserPrompt = `
    如果vue代码中有事件修饰符prevent，那么要在对应的事件处理函数中添加e.preventDefault()
`;

const trackByPrompt = `
    在San.js中，我们应该使用s-for指令的trackBy语法来指定列表每个项的key，
    把key属性对应的值写在s-for指令trackBy后面,
    转换后的san.js代码类似于：'<div s-for="todo, index in todos trackBy todo.id"></div>'
`

const forIfPrompt = `
    如果遇到v-if指令与v-for指令同时存在的情况，
    在San.js中，s-if的优先级s-for高，在转换的时候，要把s-for指令放到fragment上，包裹着s-if指令,
    例如：
    下面的vue.js代码 '<div v-for="todo in todos" :key="todo.id" s-if="todo.text">{{ todo.text }}</div>'
    转换为san.js代码 '
    <fragment s-for="todo in todos trackBy todo.id">
      <div s-if="todo.text">{{ todo.text }}</div>
    </fragment>'
`

async function handlePrevent(input) {
      const completion = await openai.createChatCompletion({
        model,
        messages: [
            system,
            {role: 'user', content: styleVueCase},
            {role: 'assistant', content: styleSanCase},
            {role: 'user', content: caseTodoApp},
            {role: 'user', content: '接下来我会给出一些修复规则'},
            {role: 'user', content: '<form @submit.prevent="addTodo">'},
            {role: 'assistant', content: '<form on-submit="addTodo">'},
            {role: 'user', content: preventUserPrompt},
            {role: 'assistant', content: `
                methods: {
                    addTodo(e) {
                        e.preventDefault();
                    }
                }
            `},
            {role: 'user', content: '请根据上述规则进行修复，直接给出代码'}
        ]
    });
    const result = completion.data.choices[0].message.content;
    return result;
}

async function handleTrackBy(input) {
    const completion = await openai.createChatCompletion({
      model,
      messages: [
          system,
          {role: 'user', content: caseTodoApp},
          {role: 'assistant', content: '初步转换后的代码:' + input},
          {role: 'user', content: '根据初步转换后的代码，在此基础上继续修复\\n'},
          {role: 'user', content: '继续按照下述修复规则进行修复'},
          {role: 'user', content: trackByPrompt}
      ]
  });
  const result = completion.data.choices[0].message.content;
  return result;
}

async function handleForIf(input) {
    const completion = await openai.createChatCompletion({
      model,
      messages: [
          system,
          {role: 'user', content: caseTodoApp},
          {role: 'assistant', content: '初步转换后的代码:' + input},
          {role: 'user', content: '接下来我会给出一些修复规则'},
          {role: 'user', content: '<div v-for="todo in todos" :key="todo.id"></div>'},
          {role: 'assistant', content: '<div s-for="todo in todos trackBy todo.id"></div>'},
          {role: 'user', content: '<div v-if="todo.text" v-for="todo in todos" :key="todo.id">{{ todo.text }}</div>'},
          {role: 'assistant', content: `
          <fragment s-for="todo in todos trackBy todo.id" >
            <div s-if="todo.text">{{ todo.text }}</div>
          </fragment>
          `},
          {role: 'user', content: forIfPrompt},
          {role: 'user', content: '请根据上述规则进行修复，直接给出代码'}
      ],
      temperature: 0.1
  });
  const result = completion.data.choices[0].message.content;
  return result;
}


async function pipeline() {
    let temp = await handlePrevent();
    console.log('prevent处理完成', temp);
    temp = await handleTrackBy(temp);
    console.log('key处理完成', temp);
    temp = await handleForIf(temp);
    console.log('for指令与if指令共存处理完成');
    return temp;
}

pipeline().then(result => {
    fs.writeFileSync('./App.san', result);
});