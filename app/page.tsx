'use client';

import { useEffect, useRef } from 'react';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const mix = (from: number, to: number, amount: number) =>
  from + (to - from) * amount;

const cmuGrabResultPages = [
  [265, 267, 269, 270],
  [268, 272, 273, 274],
];

const hkmalaResultRows = [
  [
    {
      filename:
        '2014-0917-WingChungKyun-3_loose_visualization_with_markers.mp4',
      kungfuStyleEnglish: 'Wing Chung',
      kungfuStyleChinese: '永春',
    },
    {
      filename: '2014-0823-HangKyun-2_loose_visualization_with_markers.mp4',
      kungfuStyleEnglish: 'Eagle Claw Fan Tsi Moon',
      kungfuStyleChinese: '鷹爪翻子門',
    },
    {
      filename: '2015-0205-jeFe-02_loose_visualization_with_markers.mp4',
      kungfuStyleEnglish: 'Huen Kuen',
      kungfuStyleChinese: '洪拳',
    },
    {
      filename: '2014-0823-DaaiHungKyun_loose_visualization_with_markers.mp4',
      kungfuStyleEnglish: 'Eagle Claw Fan Tsi Moon',
      kungfuStyleChinese: '鷹爪翻子門',
    },
  ],
  [
    {
      filename: '2014-0730-SiuMuiFaaKyun_loose_visualization_with_markers.mp4',
      kungfuStyleEnglish: 'Hung Sing Choy lee Fat',
      kungfuStyleChinese: '鴻勝蔡李佛',
    },
    {
      filename:
        '2015-0120-PekGwaaSammLou_loose_visualization_with_markers.mp4',
      kungfuStyleEnglish: 'Tai Sing Pap Kar Moon',
      kungfuStyleChinese: '大聖劈掛門',
    },
    {
      filename: '2014-0820-Taiji_loose_visualization_with_markers.mp4',
      kungfuStyleEnglish: "Yang's Taiji",
      kungfuStyleChinese: '楊式太極',
    },
    {
      filename: '2014-0730-SupJeeKuen2_loose_visualization_with_markers.mp4',
      kungfuStyleEnglish: 'Hung Sing Choy lee Fat',
      kungfuStyleChinese: '鴻勝蔡李佛',
    },
  ],
  [
    {
      filename:
        '2014-0821-GaostyleBaguaZhangngKuen_loose_visualization_with_markers.mp4',
      kungfuStyleEnglish: 'Gao style Bagua Zhang',
      kungfuStyleChinese: '高式八卦掌',
    },
    {
      filename:
        '2014-1126-DoubleDragonKyun-6_loose_visualization_with_markers.mp4',
      kungfuStyleEnglish: 'Jin Wu Koon Shaolin Double Dragon',
      kungfuStyleChinese: '少林雙龍派振武館',
    },
    {
      filename:
        '2014-0915-Yang_Zhao_Meng-Baji_Xiao_Jia-B_loose_visualization.mp4',
      kungfuStyleEnglish: "Ma's Tong Bei",
      kungfuStyleChinese: '馬氏通備',
    },
    {
      filename: '2014-0823-LinKyun-1_loose_visualization_with_markers.mp4',
      kungfuStyleEnglish: 'Eagle Claw Fan Tsi Moon',
      kungfuStyleChinese: '鷹爪翻子門',
    },
  ],
];

const setConfiguredPlaybackRate = (video: HTMLVideoElement) => {
  const playbackRate = Number(video.dataset.playbackRate) || 1;
  video.defaultPlaybackRate = playbackRate;
  video.playbackRate = playbackRate;
};

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const creditsRef = useRef<HTMLElement>(null);
  const videoRatioRef = useRef(16 / 9);

  useEffect(() => {
    const resultVideos = Array.from(
      document.querySelectorAll<HTMLVideoElement>('.result-video'),
    );

    const keepConfiguredSpeed = (event: Event) => {
      setConfiguredPlaybackRate(event.currentTarget as HTMLVideoElement);
    };

    resultVideos.forEach((video) => {
      video.addEventListener('loadedmetadata', keepConfiguredSpeed);
      video.addEventListener('canplay', keepConfiguredSpeed);
      video.addEventListener('play', keepConfiguredSpeed);
      video.addEventListener('ratechange', keepConfiguredSpeed);

      setConfiguredPlaybackRate(video);
      void video.play().catch(() => {
        // Browsers may still block autoplay when a user has disabled it.
      });
    });

    return () => {
      resultVideos.forEach((video) => {
        video.removeEventListener('loadedmetadata', keepConfiguredSpeed);
        video.removeEventListener('canplay', keepConfiguredSpeed);
        video.removeEventListener('play', keepConfiguredSpeed);
        video.removeEventListener('ratechange', keepConfiguredSpeed);
      });
    };
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    const stage = stageRef.current;
    const title = titleRef.current;
    const credits = creditsRef.current;

    if (!hero || !stage || !title || !credits) return;

    let animationFrame = 0;

    const updateLayout = () => {
      animationFrame = 0;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const heroTop = hero.getBoundingClientRect().top;
      const scrollDistance = Math.max(hero.offsetHeight - viewportHeight, 1);
      const progress = clamp(-heroTop / scrollDistance, 0, 1);
      const easedProgress = progress * progress * (3 - 2 * progress);

      const sidePadding = viewportWidth < 640
        ? 12
        : clamp(viewportWidth * 0.03, 20, 48);
      const titleTop = viewportWidth < 640
        ? 24
        : clamp(viewportHeight * 0.05, 28, 58);
      const titleGap = viewportWidth < 640 ? 22 : 34;
      const titleHeight = title.offsetHeight;
      const targetTop = titleTop + titleHeight + titleGap;

      let targetWidth = Math.min(viewportWidth - sidePadding * 2, 1440);
      let targetHeight = targetWidth / videoRatioRef.current;

      // 最终尺寸只按宽度计算；修改此值即可调整视频大小。
      const finalVideoScale = 0.75;
      targetWidth *= finalVideoScale;
      targetHeight *= finalVideoScale;

      const targetLeft = (viewportWidth - targetWidth) / 2;
      const desiredAuthorGap = clamp(viewportHeight * 0.035, 24, 40);
      const creditsOffset = targetTop
        + targetHeight
        + desiredAuthorGap
        - viewportHeight;

      stage.style.setProperty('--video-left', `${mix(0, targetLeft, easedProgress)}px`);
      stage.style.setProperty('--video-top', `${mix(0, targetTop, easedProgress)}px`);
      stage.style.setProperty('--video-width', `${mix(viewportWidth, targetWidth, easedProgress)}px`);
      stage.style.setProperty('--video-height', `${mix(viewportHeight, targetHeight, easedProgress)}px`);
      stage.style.setProperty('--title-top', `${titleTop}px`);
      stage.style.setProperty(
        '--title-opacity',
        `${clamp((progress - 0.18) / 0.52, 0, 1)}`,
      );
      stage.style.setProperty('--frame-progress', `${easedProgress}`);
      credits.style.setProperty('--credits-offset', `${creditsOffset}px`);
    };

    const requestLayout = () => {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(updateLayout);
      }
    };

    const updateVideoRatio = () => {
      const video = videoRef.current;
      if (video?.videoWidth && video.videoHeight) {
        videoRatioRef.current = video.videoWidth / video.videoHeight;
      }
      requestLayout();
    };

    updateLayout();
    window.addEventListener('scroll', requestLayout, { passive: true });
    window.addEventListener('resize', requestLayout);
    videoRef.current?.addEventListener('loadedmetadata', updateVideoRatio);

    return () => {
      window.removeEventListener('scroll', requestLayout);
      window.removeEventListener('resize', requestLayout);
      videoRef.current?.removeEventListener('loadedmetadata', updateVideoRatio);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <main className="project-page">
      <section ref={heroRef} className="scroll-hero" aria-labelledby="project-title">
        <div ref={stageRef} className="sticky-stage">
          <header ref={titleRef} className="publication-header">
            <h1 id="project-title" className="visually-hidden">
              DirtyMoCap: Robust Motion Capture from Unconstrained Markers
            </h1>
            <img
              className="title-artwork"
              src="dirtymocap-title.png"
              alt=""
              width="2000"
              height="600"
              aria-hidden="true"
            />
            <p className="publication-subtitle" aria-hidden="true">
              Robust Motion Capture from Unconstrained Markers
            </p>
          </header>

          <div className="teaser-video-container">
            <video
              ref={videoRef}
              className="teaser-video"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              controls
              aria-label="DirtyMoCap motion-capture visualisation"
            >
              <source src="dataset.mp4" type="video/mp4" />
            </video>
          </div>

          <div className="scroll-cue" aria-hidden="true">
            <span className="scroll-cue-arrow" />
          </div>
        </div>
      </section>

      <section
        ref={creditsRef}
        className="credits-section"
        aria-labelledby="credits-title"
      >
        <h2 id="credits-title" className="visually-hidden">
          Authors and affiliations
        </h2>

        <div className="authors" aria-label="Authors">
          <a className="author-block author-link" href="https://wanglongzju.github.io/" target="_blank" rel="noreferrer">Long Wang<sup>1,2</sup>,</a>
          <a className="author-block author-link" href="https://scholar.google.com/citations?user=Nongp7UAAAAJ&hl=en" target="_blank" rel="noreferrer">Shuting Zhao<sup>3</sup>,</a>
          <a className="author-block author-link" href="https://nudt-sawlab.github.io/" target="_blank" rel="noreferrer">Shen Yan<sup>4</sup>,</a>
          <a className="author-block author-link" href="https://ysysimon.com/" target="_blank" rel="noreferrer">Siyuan Yu<sup>2</sup>,</a>
          <a className="author-block author-link" href="https://xiaobenli00.github.io/" target="_blank" rel="noreferrer">Xiaoben Li<sup>1,2</sup>,</a>
          <a className="author-block author-link" href="https://zcai0612.github.io/" target="_blank" rel="noreferrer">Zeyu Cai<sup>5</sup>,</a>
          <a className="author-block author-link" href="https://yumenghou.com/" target="_blank" rel="noreferrer">Yumeng Hou<sup>6</sup>,</a>
          <a className="author-block author-link" href="https://xiuyuliang.cn/" target="_blank" rel="noreferrer">Yuliang Xiu<sup>2</sup></a>
        </div>

        <div className="institutions" aria-label="Affiliations">
          <span className="institution-block"><sup>1</sup>Zhejiang University</span>
          <span className="institution-block"><sup>2</sup>Westlake University</span>
          <span className="institution-block"><sup>3</sup>Fudan University</span>
          <span className="institution-block">
            <sup>4</sup>National University of Defense Technology
          </span>
          <span className="institution-block"><sup>5</sup>Nanjing University</span>
          <span className="institution-block">
            <sup>6</sup>National University of Singapore
          </span>
        </div>

        <p className="venue">SIGGRAPH Asia 2026</p>

        <div className="resource-links" role="group" aria-label="Project resources">
          <a
            className="resource-button resource-button-available"
            href="https://github.com/WangLongZJU/DirtyMoCap"
            target="_blank"
            rel="noreferrer"
          >
            <span className="resource-label">Code</span>
            <span className="resource-status">GitHub</span>
          </a>
          {['arXiv', 'Data', 'License'].map((label) => (
            <button
              key={label}
              className="resource-button"
              type="button"
              disabled
              title="Coming soon"
            >
              <span className="resource-label">{label}</span>
              <span className="resource-status">Coming soon</span>
            </button>
          ))}
        </div>
      </section>

      <section
        id="abstract"
        className="abstract-section"
        aria-labelledby="abstract-title"
      >
        <div className="abstract-inner">
          <h2 id="abstract-title" className="section-title">
            Abstract
          </h2>
          <div className="abstract-content">
            <p>
              Optical motion capture delivers high-fidelity human motion, but
              its reliance on strict marker layouts and clean trajectories
              severely limits its real-world applicability. In practice,
              tracking systems frequently output unconstrained markers - sparse,
              noisy, and unordered point clouds with unknown or varying
              configurations. To bridge the gap between corrupted raw markers
              and parametric human models, we introduce DirtyMoCap, a robust,
              marker-layout-free framework. Our core insight is to map unordered
              marker observations to a fixed set of "proxy anchors" - comprising
              skeletal joints and body surface points - acting as a stable
              intermediate representation. We first initialize and track these
              anchors over long sequences using a recurrent sliding-window
              architecture. Then, a custom differentiable Gauss-Newton solver
              fits the SMPL-H model to the tracked anchors to recover full-body
              pose, translation, and shape. By explicitly deriving geometric
              residuals, our solver learns adaptive observation confidence,
              smoothness, and prior weights end-to-end, adapting dynamically to
              the reliability of the input data. Extensive experiments on
              diverse, noisy marker configurations demonstrate that DirtyMoCap
              successfully generalizes across arbitrary layouts using only a
              single trained model. It consistently outperforms state-of-the-art
              configuration-specific baselines in both joint and vertex
              reconstruction accuracy, while our custom CUDA solver achieves up
              to a 100× speedup over standard PyTorch implementations. We further
              apply DirtyMoCap to heterogeneous raw optical MoCap recordings of
              traditional Chinese martial arts, yielding a Kung Fu motion
              dataset of temporally coherent SMPL-H reconstructions.
            </p>
          </div>
          <div className="abstract-media-layout">
            <div className="abstract-video-wrapper">
              <video
                className="abstract-video"
                loop
                controls
                playsInline
                preload="metadata"
                aria-label="DirtyMoCap overview video"
              >
                <source src="dirtymocap-abstract.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            <p className="abstract-tldr">
              <strong>TL;DR</strong>
              Recovers 4D SMPL-H motion from dirty markers — sparse, noisy,
              and unordered — via proxy anchors and a differentiable and
              learnable Gauss–Newton solver, generalizing across marker
              configurations with a single model.
            </p>

          </div>
        </div>
      </section>

      <section
        id="method-overview"
        className="method-section"
        aria-labelledby="method-overview-title"
      >
        <div className="method-inner">
          <h2 id="method-overview-title" className="section-title">
            Method Overview
          </h2>
          <figure className="method-overview-figure">
            <img
              src="method-overview-pipeline.png"
              alt="DirtyMoCap pipeline showing anchor initialization, anchor trajectory prediction, and the differentiable learnable Gauss-Newton solver"
              loading="lazy"
              decoding="async"
            />
            <figcaption>
              <strong>Overview of DirtyMoCap.</strong> The Anchor Initialization
              step (Sec. 3.1) uses the first-frame markers <i>M</i>
              <sub>1</sub> to estimate initial anchors <i>A</i>
              <sub>1</sub> and replicates them across the remaining frames in
              the current window to form <i>A</i>
              <sup>init</sup>
              <sub>t:t+W−1</sub>. The resulting anchor sequence, together with{' '}
              <i>M</i>
              <sub>t:t+W−1</sub>, is then passed to the Anchor Trajectory
              Prediction module (Sec. 3.2) to refine <i>A</i>
              <sub>t:t+W−1</sub>. Finally, a differentiable learnable
              Gauss–Newton solver (Sec. 3.3) optimizes the SMPL-H parameters,
              including pose, global translation, and shape. The estimates from
              the current window initialize the next one.
            </figcaption>
          </figure>
        </div>
      </section>

      <section
        id="cmu-grab-results"
        className="results-section"
        aria-labelledby="cmu-grab-results-title"
      >
        <div className="results-inner">
          <h2 id="cmu-grab-results-title" className="section-title">
            DirtyMoCap on CMU+GRAB Dataset
          </h2>

          <article
            className="result-panel result-video-panel"
            aria-label="CMU and GRAB results"
          >
            <div
              className="result-video-scroller"
              aria-label="Horizontally scrollable CMU and GRAB results"
              tabIndex={0}
            >
              <div className="result-video-track">
                {cmuGrabResultPages.map((page, pageIndex) => (
                  <div className="result-video-page" key={pageIndex}>
                    {page.map((sequence) => (
                      <figure className="result-video-item" key={sequence}>
                        <video
                          className="result-video"
                          autoPlay
                          muted
                          loop
                          controls
                          playsInline
                          preload="auto"
                          data-playback-rate="2"
                          aria-label={`CMU and GRAB result sequence ${sequence}`}
                        >
                          <source
                            src={`results/syn-results-${sequence}.mp4`}
                            type="video/mp4"
                          />
                          Your browser does not support the video tag.
                        </video>
                      </figure>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>

      <section
        id="hkmala-results"
        className="results-section hkmala-results-section"
        aria-labelledby="hkmala-results-title"
      >
        <div className="results-inner">
          <h2 id="hkmala-results-title" className="section-title">
            HKMALA-Motion Dataset Reconstructed by DirtyMoCap
          </h2>
          <p className="results-description hkmala-results-description">
            We further apply DirtyMoCap to a heterogeneous collection of raw
            optical MoCap recordings of traditional Chinese martial arts, for
            which marker configurations and marker identities are unavailable.
            The collection contains real motion sequences captured between
            September 2013 and March 2022, averaging approximately 8,500 frames
            per sequence and totaling about 180 minutes across 22 normalized
            martial-arts style labels. Processing these noisy and unordered
            observations with DirtyMoCap yields temporally coherent SMPL-H
            motion and enables the construction of the Kung Fu motion dataset.
          </p>
          <article
            className="result-panel result-video-panel"
            aria-label="HKMALA-Motion results"
          >
            <div
              className="hkmala-video-scroller"
              aria-label="Horizontally scrollable HKMALA-Motion results"
              tabIndex={0}
            >
              <div className="hkmala-video-track">
                {hkmalaResultRows.map((row, rowIndex) => (
                  <div className="hkmala-video-row" key={rowIndex}>
                    {row.map((videoResult) => (
                      <figure
                        className="result-video-item"
                        key={videoResult.filename}
                      >
                        <video
                          className="result-video"
                          autoPlay
                          muted
                          loop
                          controls
                          playsInline
                          preload="auto"
                          data-playback-rate="1"
                          aria-label={`HKMALA-Motion result ${videoResult.filename.replace('.mp4', '')}`}
                        >
                          <source
                            src={`results/${videoResult.filename}`}
                            type="video/mp4"
                          />
                          Your browser does not support the video tag.
                        </video>
                        <figcaption className="hkmala-video-caption">
                          <span className="hkmala-style-english">
                            {videoResult.kungfuStyleEnglish}
                          </span>
                          <span
                            className="hkmala-style-chinese"
                            lang="zh-Hant"
                          >
                            {videoResult.kungfuStyleChinese}
                          </span>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>

      <section
        id="acknowledgements"
        className="acknowledgements-section"
        aria-labelledby="acknowledgements-title"
      >
        <div className="acknowledgements-inner">
          <h2 id="acknowledgements-title" className="section-title">
            Acknowledgements
          </h2>
          <div className="acknowledgements-content">
            <p>
              We thank International Guoshu Association Limited and the
              Institute of Chinese Martial Studies Limited for providing access
              to the raw martial-arts motion-capture recordings used to
              construct the HKMALA-Motion dataset. This work is funded by the
              Research Center for Industries of the Future (RCIF) at Westlake
              University, the Westlake Education Foundation.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
