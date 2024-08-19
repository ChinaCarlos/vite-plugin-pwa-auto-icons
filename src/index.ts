import { Plugin } from 'vite';
import sharp, { FormatEnum } from 'sharp';
import fs from 'fs';
import path from 'path';

export const enum IMG_FORMAT_ENUM {
    PNG = 'png',
    WEBP = 'webp',
}

interface PwaAutoIconPluginOptions {
    /**
     * PWA Icon 原始尺寸图片地址，建议 512 x 512 尺寸大小，后续向不同尺寸转换，只支持PNG，webP,推荐PNG
     */
    iconPath: string;
    /**
     * PWA Icon 各种尺寸图标的输出目录 默认是icons
     */
    outDir?: string;
    /**
     * icon 输入格式，支持 png, webP
     */
    format?: IMG_FORMAT_ENUM;
    /**
     * 需要输出PWA图标的尺寸
     */
    sizes?: number[];
    /**
     * 是否压缩，默认false  不压缩
     */
    isCompress?: boolean;
    /**
     * PWA Icon 压缩等级 0 - 9， 只有开启压缩才生效 0（最快、最大）到 9（最慢、最小
     */
    compressionLevel?: number;
    /**
     * PWA Icon wep格式的压缩质量
     */
    quality?: number;
    /**
     * PWA icon 命名格式
     */
    customIconFileName?: (size: number, format: IMG_FORMAT_ENUM) => string;
}

const cwd = process.cwd();
const PLUGIN_NAME = 'PwaAutoIconPlugin';
const DEFAULT_OUT_DIR = 'icons';
const DEFAULT_ICON_PATH = `${cwd}/icon.png`;
const DEFAULT_ICON_SIZES = [32, 48, 64, 72, 96, 128, 144, 192, 256, 512];
const DEFAULT_CUSTOM_ICON_FILE_NAME = (size: number, format: IMG_FORMAT_ENUM) => `${size}x${size}.${format}`;

class PwaAutoIconPlugin implements Plugin {
    public readonly name = PLUGIN_NAME;
    static outDir = DEFAULT_OUT_DIR;
    static iconPath = DEFAULT_ICON_PATH;
    static sizes = DEFAULT_ICON_SIZES;
    static isCompress = false;
    static compressionLevel = 9;
    static format = IMG_FORMAT_ENUM.PNG;
    static quality = 100;

    static customIconFileName = DEFAULT_CUSTOM_ICON_FILE_NAME;
    constructor(options: PwaAutoIconPluginOptions) {
        PwaAutoIconPlugin.outDir = options?.outDir || DEFAULT_OUT_DIR;
        PwaAutoIconPlugin.iconPath = options?.iconPath || DEFAULT_ICON_PATH;
        PwaAutoIconPlugin.sizes = options?.sizes?.length ? options?.sizes : DEFAULT_ICON_SIZES;
        PwaAutoIconPlugin.isCompress = options?.isCompress || false;
        PwaAutoIconPlugin.compressionLevel = options?.compressionLevel || 9;
        PwaAutoIconPlugin.format = options?.format || IMG_FORMAT_ENUM.PNG;
        PwaAutoIconPlugin.quality = options?.quality || 100;
        PwaAutoIconPlugin.customIconFileName = options?.customIconFileName || DEFAULT_CUSTOM_ICON_FILE_NAME;
    }

    static _generatePwaIcons() {
        const outDirPath = path.join(cwd, PwaAutoIconPlugin.outDir);

        PwaAutoIconPlugin.sizes.forEach(size => {
            const fileName = PwaAutoIconPlugin?.customIconFileName(size, PwaAutoIconPlugin.format);
            const outImgPath = path.join(outDirPath, fileName);

            let currentImgSharp = sharp(path.join(cwd, PwaAutoIconPlugin.iconPath))
                .resize({
                    width: size,
                    height: size,
                    fit: sharp.fit.cover,
                })
                .toFormat(PwaAutoIconPlugin.format as keyof FormatEnum);

            if (PwaAutoIconPlugin.isCompress) {
                if (PwaAutoIconPlugin.format === IMG_FORMAT_ENUM.PNG) {
                    currentImgSharp = currentImgSharp.png({
                        compressionLevel: PwaAutoIconPlugin.compressionLevel,
                        quality: PwaAutoIconPlugin.quality,
                    });
                } else if (PwaAutoIconPlugin.format === IMG_FORMAT_ENUM.WEBP) {
                    currentImgSharp = currentImgSharp.webp({
                        quality: PwaAutoIconPlugin.quality,
                        lossless: true,
                    });
                }
            }

            currentImgSharp
                .toFile(outImgPath) // 保存文件
                .then(file => {
                    console.log(`Saved: ${fileName}`, Number(file.size / 1024).toFixed(2) + 'kb');
                })
                .catch(err => {
                    console.error('Error processing image:', err);
                });
        });
    }

    buildStart() {
        const outDirPath = path.join(cwd, PwaAutoIconPlugin.outDir);
        // 创建输出目录
        if (fs.existsSync(outDirPath)) {
            fs.rmSync(outDirPath, { recursive: true, force: true });
            fs.mkdirSync(outDirPath);
        } else {
            fs.mkdirSync(outDirPath);
        }
        // 初始化或准备工作
        PwaAutoIconPlugin._generatePwaIcons();
    }

    buildEnd() {
        console.log('\x1b[32m%s\x1b[0m', 'PWA Icons generate success!');
    }
}

export default (options: PwaAutoIconPluginOptions) => {
    return new PwaAutoIconPlugin(options);
};
