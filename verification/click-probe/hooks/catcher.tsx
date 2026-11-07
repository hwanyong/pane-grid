import type { ClientModule } from 'claude-code'

const Catcher: ClientModule<{ cell: string }, { isStarted: true }> = (props, surface) => {
  if (surface.state == undefined) {
    surface.onPointer(event => {
      if (event.type == 'down' || event.type == 'up') surface.post({ cell: props.cell, type: event.type, x: event.x, y: event.y })
    })
    surface.onKey(event => surface.post({ cell: props.cell, key: event.key }))
    surface.setState({ isStarted: true })
  }
  const { Box } = surface.elements
  return <Box />
}

export default Catcher
