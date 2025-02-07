import type { Root } from 'hast'
import { toJsxRuntime, type Options as hastToJsxOptions } from 'hast-util-to-jsx-runtime'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { children, createMemo, ParentComponent, Show } from 'solid-js'
import { Fragment, jsx, jsxs } from 'solid-jsx'
import { Dynamic } from 'solid-js/web'
import { PluggableList, Processor, unified } from 'unified'
import { VFile } from 'vfile'

type SolidMarkdownProps = {
  remarkPlugins?: PluggableList
  rehypePlugins?: PluggableList
  class?: string
  components?: hastToJsxOptions['components']
}

const SolidjsMarkdown: ParentComponent<Partial<SolidMarkdownProps>> = (props) => {
  const c = children(() => props.children)

  const astToElement = (ast: Root) => {
    const options: hastToJsxOptions = {
      Fragment,
      jsx,
      jsxs,
      elementAttributeNameCase: 'html',
      stylePropertyNameCase: 'css',
      components: props.components,
    } as unknown as hastToJsxOptions
    return toJsxRuntime(ast, options)
  }

  const hastNode = createMemo(() => {
    const processor = unified()
      .use(remarkParse)
      .use(props.remarkPlugins || [])
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(props.rehypePlugins || []) as Processor<Root, Root, Root>

    const file = new VFile()

    if (typeof c() === 'string') {
      file.value = c() as string
    } else if (c() !== undefined && props.children !== null) {
      console.warn(
        `[solidjs-markdown] Warning: please pass a string as \`children\` (not: \`${c()}\`)`
      )
    }

    const hastNode = processor.runSync(processor.parse(file), file)

    if (hastNode.type !== 'root') {
      throw new TypeError('Expected a `root` node')
    }

    return hastNode
  })
  return (
    <Show when={hastNode().type === 'root'}>
      <Dynamic component={props.class ? 'div' : Fragment} class={props.class}>
        {astToElement(hastNode())}
      </Dynamic>
    </Show>
  )
}

export default SolidjsMarkdown
