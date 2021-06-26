import React from 'react'
import styled from 'styled-components'
import BigNumber from 'bignumber.js'
import { Button, Flex, Heading, IconButton, AddIcon, MinusIcon, useModal } from '@pancakeswap-libs/uikit'
import useI18n from 'hooks/useI18n'
import useStake from 'hooks/useStake'
import useUnstake from 'hooks/useUnstake'
import { getBalanceNumber } from 'utils/formatBalance'
import DepositModal from '../DepositModal'
import WithdrawModal from '../WithdrawModal'

interface FarmCardActionsProps {
  stakedBalance?: BigNumber
  tokenBalance?: BigNumber
  tokenName?: string
  pid?: number
  depositFeeBP?: number
  usdStaked: BigNumber
}

const IconButtonWrapper = styled.div`
  display: flex;
  svg {
    width: 20px;
  }
`
const Label = styled.div`
  color: ${({ theme }) => theme.colors.textSubtle};
  font-size: 12px;
  align:left
`
const StakeAction: React.FC<FarmCardActionsProps> = ({ stakedBalance, tokenBalance, tokenName, pid, depositFeeBP, usdStaked}) => {
  const TranslateString = useI18n()
  const { onStake } = useStake(pid)
  const { onUnstake } = useUnstake(pid)

  const rawStakedBalance = getBalanceNumber(stakedBalance)
  let displayUSD = getBalanceNumber(usdStaked).toLocaleString();
  let displayBalance = rawStakedBalance.toLocaleString()
  if(pid === 7 || pid === 5){
    // USDT or USDC
    displayBalance = new BigNumber(rawStakedBalance).multipliedBy(10**12).toString();
    displayUSD = getBalanceNumber(usdStaked, 6).toLocaleString();
  }
  if(pid === 9){
    // WBTC
    displayBalance = new BigNumber(rawStakedBalance).multipliedBy(10000000000).toString();
    displayUSD = getBalanceNumber(usdStaked, 8).toLocaleString();
  }


  const [onPresentDeposit] = useModal(<DepositModal max={tokenBalance} onConfirm={onStake} tokenName={tokenName} depositFeeBP={depositFeeBP} />)
  const [onPresentWithdraw] = useModal(
    <WithdrawModal max={stakedBalance} onConfirm={onUnstake} tokenName={tokenName} />,
  )

  const renderStakingButtons = () => {
    return rawStakedBalance === 0 ? (
      <Button onClick={onPresentDeposit}>{TranslateString(999, 'Stake')}</Button>
    ) : (
      <IconButtonWrapper>
        <IconButton variant="tertiary" onClick={onPresentWithdraw} mr="6px">
          <MinusIcon color="primary" />
        </IconButton>
        <IconButton variant="tertiary" onClick={onPresentDeposit}>
          <AddIcon color="primary" />
        </IconButton>
      </IconButtonWrapper>
    )
    
  }
  
  return (
    <Flex justifyContent="space-between" alignItems="center">

      <Heading color={rawStakedBalance === 0 ? 'textDisabled' : 'text'}>{displayBalance}      {usdStaked.gt(0)?<Label>~${(displayUSD)} USD</Label>:null}</Heading>
      {renderStakingButtons()}
    </Flex>
  )
}

export default StakeAction
