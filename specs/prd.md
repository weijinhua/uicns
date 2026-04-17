
# Product
创建一个AI生成Charts的网站，网站名 Charts Generator。

##Core Features
- 网站左边是用户历史生成的图表名称列表，右边上部分是图表展示区域，下面是文本输入框。
- 点击左边的图表名，在右上部显示已保存的图表。
- 用户在输入框输入任意和数据相关的提示词，例如：
"帮我比较一下今年一到六月，北京和上海的月度销售额：北京是 120、130、150、170、180、200；上海是100、140、160、150、190、210"
然后发送给AI后，LLM能够自动提取这段提示词中的数据和文本，选择一个最佳的图表进行渲染。如果用户指定了某个图表类型，就会使用用户指定的图表类型进行渲染。
- 生成的图表可以导出图片，也可以保存到历史表表中。
- 用户通过email注册。通过用户名和密码验证登录。

## UI Strategy
- MUST use Design System
- MUST use Core Components only
- UI must be visually consistent

## Language Strategy
- Default language: zh-CN
- MUST use i18n system
- MUST NOT hardcode any UI text
- MUST be i18n-ready (multi-language support)

## AI Development Strategy
- Code generation MUST follow spec + rules
- No free-style UI or text generation

## Non-functional
- support 10k users
- Low latency
- Easy to scale
- team familiar nestjs, nextjs and typescript
