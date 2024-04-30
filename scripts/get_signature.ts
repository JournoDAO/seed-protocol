export const generateExpandedSignature = (methodName, fragment,) => {
  const expandType = (type,) => {
    if (type.baseType === 'tuple') {
      const components = type.components.map((component,) => {
        return `${expandType(component,)}`
      },).join(',',)
      return `(${components})${type.arrayChildren ? '[]' : ''}`
    } if(type.baseType === 'array') {
      return `${expandType(type.arrayChildren,)}[]`

    } else {
      return `${type.type}${type.arrayChildren ? '[]' : ''}`
    }
  }

  const inputs = fragment.inputs.map((input,) => {
    console.log('Input', input,)
    return expandType(input,)
  },).join(',',)

  // const outputs = fragment.outputs.map((output,) => {
  //   return expandType(output,) + ' ' + output.name
  // },).join(', ',)

  // const payableModifier = fragment.payable ? ' payable' : ''
  // const stateMutability = fragment.stateMutability ? ` ${fragment.stateMutability}` : ''

  return `${fragment.name}(${inputs})`
}
