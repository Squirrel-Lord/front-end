import React, { useEffect, useCallback, useState } from 'react'
import { Route, useRouteMatch } from 'react-router-dom'
import BigNumber from 'bignumber.js'
import styled from 'styled-components'
import { useWallet } from '@binance-chain/bsc-use-wallet'
import { Heading } from '@pancakeswap-libs/uikit'
import { BLOCKS_PER_YEAR, VERT_DECIMALS } from 'config'
import orderBy from 'lodash/orderBy'
import { provider } from 'web3-core'
import partition from 'lodash/partition'
import useI18n from 'hooks/useI18n'
import useBlock from 'hooks/useBlock'
import { fetchVaultUserDataAsync } from 'state/vaults'
import { useDispatch } from 'react-redux'
import useRefresh from 'hooks/useRefresh'
import { getBalanceNumber } from 'utils/formatBalance'
import {
  useFarms,
  usePriceBnbBusd,
  usePriceCakeBusd,
  useVaults,
  usePriceWethBusd,
  usePriceBtcBusd,
  usePriceRouteBusd,
} from 'state/hooks'
import { QuoteToken, PoolCategory } from 'config/constants/types'
import FlexLayout from 'components/layout/Flex'
import Page from 'components/layout/Page'
import VaultRow, { VaultWithStakedValue, LoadingRow } from './components/VaultRow/VaultRow'
import VaultTabButtons from './components/VaultTabButtons'
import Divider from '../Farms/components/Divider'

const LockedFlex = styled(FlexLayout)`
  /* max-width:1vw!important; */
`

const Vaults: React.FC = () => {
  const { path } = useRouteMatch()
  const TranslateString = useI18n()
  const { account, ethereum }: { account: string; ethereum: provider } = useWallet()
  const vaults = useVaults()
  const block = useBlock()
  const bnbPriceUSD = usePriceBnbBusd()
  const cakePrice = usePriceCakeBusd()
  const bnbPrice = usePriceBnbBusd()
  const wethPrice = usePriceWethBusd()
  const btcPrice = usePriceBtcBusd()
  const routePrice = usePriceRouteBusd()

  const dispatch = useDispatch()
  const { slowRefresh } = useRefresh() // was fast
  useEffect(() => {
    if (account) {
      dispatch(fetchVaultUserDataAsync(account))
    }
  }, [account, dispatch, slowRefresh])

  const [stakedOnly, setStakedOnly] = useState(false)

  const activeVaults = vaults

  const stakedOnlyVaults = activeVaults.filter(
    (vault) => vault.userData && new BigNumber(vault.userData.stakedBalance).isGreaterThan(0),
  )

  const vaultsList = useCallback(
    (vaultsToDisplay, removed: boolean) => {
      const vaultsToDisplayWithAPY: VaultWithStakedValue[] = vaultsToDisplay.map((vault) => {
        if(vault === undefined){
          return null;
        }
        if(vault.type!=="standard"){
          return vault;
        }
        if(vault.rewardTokenPrice === undefined){
          return null;
        }
        const vaultRewardPerBlock = new BigNumber(vault.rewardPerBlock || 1)
        .times(new BigNumber(vault.poolWeight))
        .div(new BigNumber(10).pow(vault.rewardTokenDecimals))
        
        const vaultRewardPerYear = vaultRewardPerBlock.times(BLOCKS_PER_YEAR)
        let apr = vault.rewardTokenPrice.times(vaultRewardPerYear)

        let totalFarmValue = new BigNumber(vault.farmLPTotalInQuoteToken || 0)

        if (vault.quoteTokenSymbol === QuoteToken.BNB) {
          totalFarmValue = totalFarmValue.times(bnbPrice)
        }
        if (vault.quoteTokenSymbol === QuoteToken.CAKE) {
          totalFarmValue = totalFarmValue.times(cakePrice)
        }
        if (vault.quoteTokenSymbol === QuoteToken.WETH) {
          totalFarmValue = totalFarmValue.times(wethPrice)
        }
        if (vault.quoteTokenSymbol === QuoteToken.ROUTE) {
          totalFarmValue = totalFarmValue.times(routePrice)
        }

        if (totalFarmValue.comparedTo(0) > 0) {
          apr = apr.div(totalFarmValue)
        }


        const NUM_COMPOUNDS_PER_PERIOD = 1000;
        const apy = new BigNumber(1).plus(apr.dividedBy(NUM_COMPOUNDS_PER_PERIOD)).pow(NUM_COMPOUNDS_PER_PERIOD).minus(1)
        return { ...vault, apy, apr }
      })

       return vaultsToDisplayWithAPY.map((vault) => {
        if (vault === null || vault === undefined) {
          return (<LoadingRow />)
        }
          return vault.type === 'standard' ? (
            <VaultRow
              key={vault.pid}
              vault={vault}
              removed={removed}
              bnbPrice={bnbPrice}
              cakePrice={cakePrice}
              ethereum={ethereum}
              account={account}
              wethPrice={wethPrice}
            />
          ) : null
      })
    },
    [bnbPrice, account, cakePrice, ethereum, wethPrice, routePrice],
  )

  return (
    <Page>
      <Hero>
        <div>
          <Heading as="h1" size="xxl" mb="16px">
            {TranslateString(999, 'Vaults')}
          </Heading>
          <ul>
            <li>{TranslateString(999, 'Auto-compounding.')}</li>
            <li>{TranslateString(999, 'Grow your deposit over time.')}</li>
            <li>{TranslateString(999, 'Unstake at any time.')}</li>
            <li>{TranslateString(999, 'Compounds frequently to maximize yield.')}</li>
            <li>{TranslateString(999, 'X% performance fee on harvests.')}</li>
          </ul>
        </div>
        <img src="/images/vaults.png" alt="Vaults Icon" width={310} height={310} />
      </Hero>
      <VaultTabButtons stakedOnly={stakedOnly} setStakedOnly={setStakedOnly} />
      <Divider />
      <LockedFlex>
        <Route exact path={`${path}`}>
          <>
            {stakedOnly ? vaultsList(stakedOnlyVaults, false) : vaultsList(activeVaults, false)}
            {/* {orderBy(openVaults, ['sortOrder']).map((vault) => (
              <VaultRow
                key={vault.pid}
                vault={vault}
                removed={removed}
                bnbPrice={bnbPrice}
                cakePrice={cakePrice}
                ethereum={ethereum}
                account={account}
                wethPrice={wethPrice}
              />
            ))} */}
          </>
        </Route>
        <Route path={`${path}/history`}>
          {/* {orderBy(finishedVaults, ['sortOrder']).map((vault) => (
            <VaultRow  
            key={vault.pid}
            vault={vault}
            removed={removed}
            bnbPrice={bnbPrice}
            cakePrice={cakePrice}
            ethereum={ethereum}
            account={account}
            wethPrice={wethPrice} />
          ))} */}
        </Route>
      </LockedFlex>
    </Page>
  )
}

const Hero = styled.div`
  align-items: center;
  color: ${({ theme }) => theme.colors.primary};
  display: grid;
  grid-gap: 32px;
  grid-template-columns: 1fr;
  margin-left: auto;
  margin-right: auto;
  max-width: 250px;
  padding: 48px 0;
  ul {
    margin: 0;
    padding: 0;
    list-style-type: none;
    font-size: 16px;
    li {
      margin-bottom: 4px;
    }
  }
  img {
    height: auto;
    max-width: 100%;
  }
  @media (min-width: 576px) {
    grid-template-columns: 1fr 1fr;
    margin: 0;
    max-width: none;
  }
`

export default Vaults
