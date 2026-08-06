/* 讓 CMS 編輯畫面右側的「即時預覽」長得跟前台網站一樣。
   直接套用網站正式的 style.css，並用跟 article.njk / plan.njk 相同的 HTML 結構組出預覽畫面。 */

CMS.registerPreviewStyle('../css/style.css');

function PreviewChrome(h, children) {
  return h('div', { className: 'cms-preview-chrome' },
    h('div', { className: 'glow glow--a' }),
    h('div', { className: 'glow glow--b' }),
    h('div', { className: 'grain' }),
    children
  );
}

var PostPreview = createClass({
  render: function () {
    var entry = this.props.entry;
    var data = entry.get('data');
    var getAsset = this.props.getAsset;
    var heroImage = data.get('heroImage');

    return PreviewChrome(h,
      h('main', {},
        h('article', {},
          h('div', { className: 'article-hero' },
            h('span', { className: 'article-hero__tag' }, data.get('tag')),
            h('h1', {}, data.get('title')),
            h('p', { className: 'article-hero__meta' }, data.get('metaLine')),
            heroImage && h('div', { className: 'article-hero__image' },
              h('img', { src: getAsset(heroImage).toString(), alt: data.get('heroImageAlt') })
            )
          ),
          h('div', { className: 'article-body' },
            h('p', { className: 'article-body__lead' }, data.get('leadParagraph')),
            h('div', { className: 'article-section' }, this.props.widgetFor('body')),
            h('div', { className: 'article-cta glass-panel' },
              h('p', {}, '如果你也想在日本滑雪旅行中留下自然又有質感的回憶，歡迎查看日本滑雪攝影方案與可預約檔期。'),
              h('a', { className: 'article-cta__btn glass' }, '查看預約方案 →')
            )
          )
        )
      )
    );
  }
});

var PlanPreview = createClass({
  render: function () {
    var entry = this.props.entry;
    var data = entry.get('data');
    var getAsset = this.props.getAsset;
    var heroImage = data.get('heroImage');
    var sections = data.get('sections') ? data.get('sections').toJS() : [];
    var groups = data.get('groups') ? data.get('groups').toJS() : [];
    var groupsHeading = data.get('groupsHeading') || '方案內容';

    return PreviewChrome(h,
      h('main', {},
        h('article', {},
          h('div', { className: 'article-hero' },
            h('span', { className: 'article-hero__tag' },
              (data.get('eyebrowNumber') || '') + ' · ' + (data.get('eyebrowLabel') || data.get('title'))),
            h('h1', {}, data.get('title')),
            h('p', { className: 'article-hero__meta' }, data.get('subtitleEn')),
            heroImage && h('div', { className: 'article-hero__image' },
              h('img', { src: getAsset(heroImage).toString(), alt: data.get('heroImageAlt') })
            )
          ),
          h('div', { className: 'article-body' },
            h('p', { className: 'article-body__lead' }, data.get('leadParagraph')),
            sections.map(function (section, i) {
              return h('div', { className: 'article-section', key: 'section-' + i },
                h('h2', {}, section.heading),
                h('ul', {}, (section.items || []).map(function (item, j) {
                  return h('li', { key: j }, item);
                }))
              );
            }),
            groups.length > 0 && h('div', { className: 'article-section' },
              h('h2', {}, groupsHeading),
              h('div', { className: 'plan-premium__groups' },
                groups.map(function (group, i) {
                  return h('div', { className: 'plan-premium__group', key: 'group-' + i },
                    h('h4', {}, h('span', {}, group.icon), ' ' + group.title),
                    h('ul', {}, (group.items || []).map(function (item, j) {
                      return h('li', { key: j }, item);
                    }))
                  );
                })
              )
            ),
            h('div', { className: 'article-cta glass-panel' },
              h('p', {}, data.get('ctaText')),
              h('a', { className: 'article-cta__btn glass' }, '查看預約方式 →')
            )
          )
        )
      )
    );
  }
});

CMS.registerPreviewTemplate('posts', PostPreview);
CMS.registerPreviewTemplate('plans', PlanPreview);
