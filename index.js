/**
 * 自定义最新版本号
 * @typedef {object} CustomVersion
 * @property {string} type - 更新类型，可选值：android、iosDevelop、wgt
 * @property {string} version - app版本号
 * @property {string} url - app下载地址
 *
 */
/**
 * 可安装版本
 * @typedef {object} installVersion
 * @property {string} type - 更新类型，可能值：'app'、'wgt'
 * @property {string} version - 版本号
 * @property {string} url - 下载地址
 *
 */

/**
 * Version 更新程序
 * @version 0.0.1
 */
export class Version {
  options = {}; //传入参数
  autoCheck = true; // 是否自动检查更新
  SystemInfo = null;

  /**
   * 初始化
   * @param {Object} opts
   * @param {Boolean} opts.autoCheck 是否自动检查更新
   * @param {Function} opts.customGetVersion 自定义获取最新版本号
   * @param {Function} opts.onDownloadProcess  下载进度回调
   * @param {Function} opts.onDownloadSuccess 下载成功回调
   * @param {Function} opts.onInstallError 安装失败回调
   * @param {Function} opts.onError 失败回调
   *
   */
  constructor(opts) {
    try {
      this.options = opts;
      // 合并默认配置
      for (const key in opts) {
        if (Object.hasOwnProperty.call(opts, key)) {
          this[key] = opts[key];
        }
      }

      this.SystemInfo = uni.getSystemInfoSync();

      if (this.autoCheck) {
        this.init();
      }
    } catch (error) {
      this.onError(new Error("不在uni支持的环境"));
    }
  }
  async init() {
    if (!this.isApp()) {
      this.onError(new Error("仅支持App"));
      return;
    }
    if (this.options.customGetVersion) {
      try {
        var version = await this.customGetVersion();
        if (version && version.version) {
          let checked = this.check(version);
          if (checked) {
            this.updateTips(checked);
          }
        }
      } catch (error) {
        this.onError(error);
      }
    }
  }
  /**
   * 自定义获取最新版本号
   * @returns {Promise<CustomVersion|any> }
   */
  async customGetVersion() {}
  /**
   * 自定义错误回调
   * @param {Error} error 错误信息
   */
  onError(error) {}
  /**
   * 下载进度
   * @param {*} percent 当前下载进度
   * @param {*} downloadedSize 当前下载大小
   * @param {*} totalSize 总大小
   */
  onDownloadProcess(percent, downloadedSize, totalSize) {}
  /**
   * 下载完成回调
   * 返回false时，将不会自动安装；
   * @param {string} tempFilePath 下载文件路径
   * @param {installVersion} version
   * @returns {boolean} 是否自动安装
   */
  onDownloadSuccess(tempFilePath, version) {
    return true;
  }
  /**
   * 安装失败回调
   * @param {Error} error 错误信息
   * @param {installVersion} version 版本信息
   */
  onInstallError(error, version) {}

  getAppid() {
    return this.SystemInfo.appId;
  }
  getVersion() {
    return this.SystemInfo.appVersion;
  }
  getWgtVersion() {
    return this.SystemInfo.appWgtVersion;
  }
  getVersionCode() {
    return this.SystemInfo.appVersionCode;
  }
  // getWgtVersionCode() {
  //   return this.SystemInfo.appWgtVersion;
  // }
  isApp() {
    console.log(this.SystemInfo.uniPlatform);
    return this.SystemInfo.uniPlatform == "app";
  }
  isAndroid() {
    return this.SystemInfo.platform == "android";
  }
  isIos() {
    return this.SystemInfo.platform == "ios";
  }
  /**
   *  判断两个版本的大小
   *  返回1表示v2大于v1;
   *  返回-1表示v2小于v1;
   *  返回0表示v2等于v1;
   * @param {string} v1 旧版本
   * @param {string} v2 新版本
   * @returns {number} 版本号比较结果
   */
  compareVersion(v1, v2) {
    if (v1 === v2) {
      return 0;
    }
    let v1s = v1.replace(/[a-zA-Z]/g, "").split(".");
    let v2s = v2.replace(/[a-zA-Z]/g, "").split(".");
    console.log(v1s, v2s);

    const len = Math.max(v1s.length, v2s.length);

    // 版本号长度不一致
    if (v1s.length < v2s.length) {
      return 1;
    } else if (v1s.length > v2s.length) {
      return -1;
    }

    var flag = 0;

    for (let i = 0; i < len; i++) {
      const num1 = parseInt(v1s[i]);
      const num2 = parseInt(v2s[i]);
      console.log(num1, num2);
      if (num1 > num2) {
        flag = -1;
        break;
      } else if (num1 < num2) {
        flag = 1;
        break;
      }
    }

    return flag;
  }
  /**
   * 检查更新
   * @param {CustomVersion} newVersion 最新版本号
   * @returns {installVersion | null}
   */
  check(newVersion) {
    if (!this.isApp()) {
      this.onError(new Error("仅支持App"));
      return null;
    }

    if (newVersion.type == "wgt") {
      if (this.compareVersion(this.getWgtVersion(), newVersion.version) === 1) {
        return newVersion;
      }
    } else {
      if (this.compareVersion(this.getVersion(), newVersion.version) === 1) {
        return newVersion;
      }
    }
    // var appVersionDiff = this.compareVersion(
    //   this.getVersion(),
    //   newVersion.appVersion
    // );
    // if (appVersionDiff === 1) {
    //   return {
    //     type: "app",
    //     version: newVersion.appVersion,
    //     url: newVersion.appUrl,
    //   };
    // } else if (
    //   appVersionDiff === 0 &&
    //   this.compareVersion(this.getWgtVersion(), newVersion.wgtVersion) === 1
    // ) {
    //   // 如果app版本号相同，则比较wgt版本号
    //   return {
    //     type: "wgt",
    //     version: newVersion.wgtVersion,
    //     url: newVersion.wgtVersionUrl,
    //   };
    // }
    return null;
  }

  /**
   * 提示更新
   * @param {installVersion} version
   */
  updateTips(version) {
    console.log("提示更新", version);
    if (version.type === "android") {
      // 提示更新app
      uni.showModal({
        title: "升级提醒",
        content: `发现新版本${version.version}，是否更新？`,
        success: (res) => {
          if (res.confirm) {
            // 开始下载
            console.log("提示更新后", version);
            this.download(version);
          }
        },
      });
      // plus.runtime.launchApplication(
      //   {
      //     action: `itms-apps://itunes.apple.com/cn/app/id${appleId}?mt=8`,
      //   },
      //   function (e) {
      //     console.log("Open system default browser failed: " + e.message);
      //   }
      // );
    } else if (version.type === "iosAppstore") {
      // 提示更新ios app
      uni.showModal({
        title: "升级提醒",
        content: `发现新版本${version.version}，请自行前往AppStore更新`,
        showCancel: false,
      });
    } else if (version.type === "iosDevelop") {
      plus.runtime.openURL(version.url);
    } else if (version.type === "wgt") {
      // 不提示、自动更新wgt
      this.download(version);
    }
  }
  downloader = null;
  downloadedPercent = 0;
  totalBytesWritten = 0;
  totalBytesExpectedToWrite = 0;
  download(version) {
    this.downloader = uni.downloadFile({
      url: version.url,
      success: (res) => {
        console.log("downloadFile", res);
        if (res.statusCode === 200) {
          var flag = this.onDownloadSuccess(res.tempFilePath, version);
          if (flag !== false) {
            this.install(res.tempFilePath, version);
          }
        } else {
          console.log("下载更新失败");

          this.onError && this.onError(new Error("下载更新失败"));
        }
      },
    });

    this.downloader.onProgressUpdate((res) => {
      // console.log("下载进度" + res.progress);
      // console.log("已经下载的数据长度" + res.totalBytesWritten);
      // console.log("预期需要下载的数据总长度" + res.totalBytesExpectedToWrite);

      this.onDownloadProcess(
        res.progress,
        res.totalBytesWritten,
        res.totalBytesExpectedToWrite
      );

      this.downloadedPercent = res.progress;
      this.totalBytesWritten = res.totalBytesWritten;
      this.totalBytesExpectedToWrite = res.totalBytesExpectedToWrite;
    });
  }

  /**
   * 下载成功后安装
   * @param {string} tempFilePath 下载的本地文件路径
   * @param {installVersion} version
   */
  install(tempFilePath, version) {
    plus.runtime.install(
      tempFilePath,
      {
        force: false,
      },
      () => {
        console.log("安装成功");
        if (version.type === "wgt") {
          // 提示重启
          uni.showModal({
            title: "升级提醒",
            content: "升级完成，请重启应用",
            success: (res) => {
              if (res.confirm) {
                plus.runtime.restart();
              }
            },
          });
        }
      },
      (error) => {
        console.log(error);
        console.log("安装失败");

        this.onInstallError(new Error("安装失败"), version);
      }
    );
  }
}

export default Version;
