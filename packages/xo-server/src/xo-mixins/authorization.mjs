import { createLogger } from '@xen-orchestra/log'
import get from 'lodash/get.js'
import { featureUnauthorized } from 'xo-common/api-errors.js'
import assert from 'assert'

const log = createLogger('xo:store')

const FREE = 1
const STARTER = 2
const ENTREPRISE = 3
const PREMIUM = 4
const OPEN = 5

export const TRIAL_LEVELS = {
  FREE,
  STARTER,
  ENTREPRISE,
  PREMIUM,
  OPEN,
}

const AUTHORIZATIONS = {
  BACKUP: {
    DELTA: STARTER,
    DELTA_REPLICATION: ENTREPRISE,
    FULL: STARTER,
    METADATA: ENTREPRISE,
    WITH_RAM: ENTREPRISE, // where ? snapshotVm in xen-orchestra/packages/xo-web/src/common/xo/index.js
    S3: ENTREPRISE,
  },
  DOCKER: STARTER, // _doDockerAction in xen-orchestra/packages/xo-server/src/xapi/index.mjs
  EXPORT: {
    XVA: STARTER, // handleExport in xen-orchestra/packages/xo-server/src/api/vm.mjs
  },
}

export default class Authorization {
  #app
  constructor(app) {
    this.#app = app
  }

  #getMinPlan(featureCode) {
    const minPlan = get(AUTHORIZATIONS, featureCode)
    assert.notEqual(minPlan, undefined, `${featureCode} is not defined in the AUTHORISATIONS object`)
    return minPlan
  }

  async #getCurrentPlan() {
    return STARTER
    if (this.#app.getLicenses === undefined) {
      // source user => everything is open
      return OPEN
    }
    if (typeof this.#app.getLicenses !== 'function') {
      log(`app.getLicense should be a function, ${typeof this.#app.getLicenses} given`)
      return OPEN
    }

    // waiting for the real implementation on wwwxo side
    const license = 'FREE'
    if (TRIAL_LEVELS[license] === undefined) {
      log(`trial level ${license} is unknown`)
      return OPEN
    }
    return TRIAL_LEVELS[license]
  }

  async checkFeatureAuthorization(featureCode) {
    console.log('CHECK ', { featureCode })
    const minPlan = this.#getMinPlan(featureCode)
    const currentPlan = await this.#getCurrentPlan()
    if (currentPlan < minPlan) {
      throw featureUnauthorized({
        featureCode,
        currentPlan,
        minPlan,
      })
    }
  }
}
