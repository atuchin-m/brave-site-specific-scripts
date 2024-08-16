/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createPort } from '../common/messaging'

import * as auth from './auth'
import * as publisherInfo from './publisherInfo'
import * as tabHandlers from '../common/tabHandlers'
import * as types from './types'
import * as utils from '../common/utils'
import * as webRequestHandlers from '../common/webRequestHandlers'

const handleOnUpdatedTab = (changeInfo: any) => {
  if (!changeInfo || !changeInfo.url) {
    return
  }

  publisherInfo.send()
}

const initScript = () => {
  // Don't run in incognito context
  if (chrome.extension.inIncognitoContext) {
    return
  }

  createPort((success: boolean) => {
    if (!success) {
      console.error('Failed to initialize communications port')
      return
    }

    // Send publisher info on readystate change
    if (utils.documentReady()) {
      publisherInfo.send()
    } else {
      document.addEventListener('readystatechange', function () {
        if (utils.documentReady()) {
          publisherInfo.send()
        }
      })
    }

    // Send publisher info on visibility change
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        publisherInfo.send()
      }
    })

    // TODO: remove the timeout when XHRInterceptor is injected automatically.
    setTimeout( () => {
      webRequestHandlers.registerOnBeforeRequestHandler(
        '^' + types.sendHeadersUrl,
        (event) => {
          if (auth.processRequestHeaders(event.headers)) {
            publisherInfo.send()
          }
        }
      )

      tabHandlers.registerOnUpdatedTab(types.mediaType, handleOnUpdatedTab)
    }, 5000);
  })

  console.info('Greaselion script loaded: twitterBase.ts')
}

initScript()
