// https://mui.com/components/material-icons/
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import React from 'react'
import styled from 'styled-components'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { materialDark as codeStyle } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { SelectChangeEvent } from '@mui/material'
import { withState } from 'reaclette'

import ActionButton from '../../components/ActionButton'
import Button from '../../components/Button'
import Checkbox from '../../components/Checkbox'
import Icon from '../../components/Icon'
import Input from '../../components/Input'
import Select from '../../components/Select'
import { alert, confirm } from '../../components/Modal'
import ProgressCircle from '../../components/ProgressCircle'
import { toNumber } from 'lodash'

interface ParentState {}

interface State {
  progressBarValue: number
  value: unknown
}

interface Props {}

interface ParentEffects {}

interface Effects {
  onChangeProgressBarValue: (e: React.ChangeEvent<HTMLInputElement>) => void
  onChangeSelect: (e: SelectChangeEvent<unknown>) => void
  sayHello: () => void
  sendPromise: (data: Record<string, unknown>) => Promise<void>
  showAlertModal: () => void
  showConfirmModal: () => void
}

interface Computed {}

const Page = styled.div`
  margin: 30px;
`

const Container = styled.div`
  display: flex;
  column-gap: 10px;
`

const Render = styled.div`
  flex: 1;
  padding: 20px;
  border: solid 1px gray;
  border-radius: 3px;
`

const Code = styled(SyntaxHighlighter).attrs(() => ({
  language: 'jsx',
  style: codeStyle,
}))`
  flex: 1;
  border-radius: 3px;
  margin: 0 !important;
`

const App = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      progressBarValue: 100,
      value: '',
    }),
    effects: {
      onChangeProgressBarValue: function (e) {
        this.state.progressBarValue = toNumber(e.target.value)
      },
      onChangeSelect: function (e) {
        this.state.value = e.target.value
      },
      sayHello: () => alert('hello'),
      sendPromise: data =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve()
            window.alert(data.foo)
          }, 1000)
        }),
      showAlertModal: () => alert({ message: 'This is an alert modal', title: 'Alert modal', icon: 'info' }),
      showConfirmModal: () =>
        confirm({
          message: 'This is a confirm modal test',
          title: 'Confirm modal',
          icon: 'download',
        }),
    },
  },
  ({ effects, state }) => (
    <Page>
      <h2>ProgressCircle</h2>
      <Container>
        <Render>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
            <ProgressCircle progress={state.progressBarValue} strokeColor='#28a745' secondaryColor='#ddd9d9' base={200}>
              {value => (
                <p
                  style={{
                    color: '#28a745',
                    fontWeight: 'bold',
                  }}
                >
                  {Math.round((value / 200) * 100)}%
                </p>
              )}
            </ProgressCircle>
            <ProgressCircle progress={state.progressBarValue} strokeColor='red' base={200} />
          </div>
          <input
            type='range'
            min='0'
            max='200'
            onChange={effects.onChangeProgressBarValue}
            step='1'
            defaultValue={state.progressBarValue}
            style={{
              display: 'block',
              margin: '10px auto',
            }}
          />
        </Render>
        <Code>
          {`<ProgressCircle progress={state.progressBarValue} strokeColor='#28a745' secondaryColor='#ddd9d9' base={200}>
  {value => (
    <p
      style={{
        color: '#28a745',
        fontWeight: 'bold',
      }}
    >
      {Math.round((value / 200) * 100)}%
    </p>
  )}
</ProgressCircle>
<ProgressCircle progress={state.progressBarValue} strokeColor='red' base={200} />`}
        </Code>
      </Container>
      <h2>ActionButton</h2>
      <Container>
        <Render>
          <ActionButton data-foo='forwarded data props' onClick={effects.sendPromise}>
            Send promise
          </ActionButton>
        </Render>
        <Code>
          {`<ActionButton data-foo='forwarded data props' onClick={effects.sendPromise}>
  Send promise
</ActionButton>`}
        </Code>
      </Container>
      <h2>Button</h2>
      <Container>
        <Render>
          <Button color='primary' onClick={effects.sayHello} startIcon={<AccountCircleIcon />}>
            Primary
          </Button>
          <Button color='secondary' endIcon={<DeleteIcon />} onClick={effects.sayHello}>
            Secondary
          </Button>
          <Button color='success' onClick={effects.sayHello}>
            Success
          </Button>
          <Button color='warning' onClick={effects.sayHello}>
            Warning
          </Button>
          <Button color='error' onClick={effects.sayHello}>
            Error
          </Button>
          <Button color='info' onClick={effects.sayHello}>
            Info
          </Button>
        </Render>
        <Code>{`<Button color='primary' onClick={doSomething} startIcon={<AccountCircleIcon />}>
  Primary
</Button>
<Button color='secondary' endIcon={<DeleteIcon />} onClick={doSomething}>
  Secondary
</Button>
<Button color='success' onClick={doSomething}>
  Success
</Button>
<Button color='warning' onClick={doSomething}>
  Warning
</Button>
<Button color='error' onClick={doSomething}>
  Error
</Button>
<Button color='info' onClick={doSomething}>
  Info
</Button>`}</Code>
      </Container>
      <h2>Icon</h2>
      <Container>
        <Render>
          <Icon icon='truck' htmlColor='#0085FF' />
          <Icon icon='truck' color='primary' size='2x' />
        </Render>
        <Code>{`// https://fontawesome.com/icons
<Icon icon='truck' htmlColor='#0085FF'/>
<Icon icon='truck' color='primary' size='2x' />`}</Code>
      </Container>
      <h2>Input</h2>
      <Container>
        <Render>
          <Input label='Input' />
          <Checkbox />
        </Render>
        <Code>{`<TextInput label='Input' />
<Checkbox />`}</Code>
      </Container>
      <h2>Modal</h2>
      <Container>
        <Render>
          <Button
            color='primary'
            onClick={effects.showAlertModal}
            sx={{
              marginBottom: 1,
            }}
          >
            Alert
          </Button>
          <Button color='primary' onClick={effects.showConfirmModal}>
            Confirm
          </Button>
        </Render>
        <Code>{`<Button
  color='primary'
  onClick={() =>
    alert({
      message: 'This is an alert modal',
      title: 'Alert modal',
      icon: 'info'
    })
  }
>
  Alert
</Button>
<Button
  color='primary'
  onClick={async () => {
    try {
      await confirm({
        message: 'This is a confirm modal',
        title: 'Confirm modal',
        icon: 'download',
      })
      // The modal has been confirmed
    } catch (reason) { // "cancel"
      // The modal has been closed
    }
  }}
>
  Confirm
</Button>`}</Code>
      </Container>
      <h2>Select</h2>
      <Container>
        <Render>
          <Select
            onChange={effects.onChangeSelect}
            options={[
              { name: 'Bar', value: 1 },
              { name: 'Foo', value: 2 },
            ]}
            value={state.value}
            valueRenderer='value'
          />
        </Render>
        <Code>
          {`<Select
  onChange={handleChange}
  optionRenderer={item => item.name}
  options={[
    { name: 'Bar', value: 1 },
    { name: 'Foo', value: 2 },
  ]}
  value={state.value}
  valueRenderer='value'
/>`}
        </Code>
      </Container>
    </Page>
  )
)

export default App
