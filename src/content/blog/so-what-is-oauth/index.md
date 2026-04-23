---
title: So What Is OAuth? A Deep Dive into the OAuth Protocol and How It Works
author: [Yorukot]
publish_date: 2026-04-21
post_slug: so-what-is-oauth
featured: true
tags: ['web', 'web-security']
description: In this blog post, we will explore the OAuth protocol, its purpose, and how it works. We will also take a closer look at its inner workings and the reasons behind its design.
lang: en
draft: true
---

這篇文章會說明 OAuth 的基本概念，這是一個我個人的學習筆記，但基本上應該會盡可能的正確，歡迎把它拿來當作學習用的資源。

# Content
- [Why we need OAuth](#why-we-need-oauth)
- 

# Why we need OAuth

在 OAuth 之前當我們需要做到取得像是 Google 或者是 Facebook 的資源的話，我們一般要做的事情是像下圖 Yelp 做的一樣我們需要使用者把自己的 Email 和 Password 給第三方在由第三方去取得資源。

![Before OAuth](./before-oauth.png)

這個做法在現在來講非常的爛，但他確實曾經存在過，而即便大多數公司都說不應該這樣做，但使用者們只是想要達到聯繫可能在 Facebook 上的好友而已，根本不會在乎這麼多資訊安全的問題。

因此在這樣的背景下，OAuth 在 2006 年時被 X (前身 Twitter) 的工程師 Blaine Cook 所提出作為初始的構想，而後位於 Google 工作的 DeWitt Clinton 也加入了討論，在之後 Eran Hammer 也加入了討論並且對 OAuth 草稿產生的強大的影響力。

在多次討論之後這篇草稿被送往 IETF 並在 2010 年發布成爲了 [RFC 5894](https://datatracker.ietf.org/doc/html/rfc5849)，而在兩年之後（2012 年）在收集了開發者們的反饋之後 OAuth 2.0 誕生了並且由於他在改進後的可實現性以及安全性皆大大提升（但還是有安全性問題），所以很快的被各大公司所採用。

而因為 OAuth 1.0 使用的人實際上非常少，目前也基本滅絕了，所以以下的 OAuth 皆代表 OAuth 2.0。

然後接著因為 OAuth 的使用過於廣泛，並且之後還有一些安全性問題，後來接續推出了很多的 "OAuth Plugin" RFC 來增強 OAuth 的廣泛使用性（如下面那張圖顯示的複雜性）。這個系列後面會在提到更多的細節。

![OAuth maze](./oauth-maze.png)

> 圖片來源: McGovern, L. (2019). OAuth 2.1: How many RFCs does it take to change a lightbulb? Retrieved from

順帶一題 OAuth 2.1 正在草稿中，如果你有興趣歡迎到 https://events.oauth.net 看看。

# How does OAuth2.0 Works
## Roles
Before we start the overall we first need to understand all the role in OAuth 2.0 base on the [RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-1.1)

Before we dive into the roles i want to first create a scene for Oauth2.0 just for better explain. So let's say you have a google account call `yorukot` and now you want to share `yorukot`'s gmail data to miscroft for whatever reason, and in this case you are using browser to open Gmail open miscorft etc.

> Note that right now we only want to access 'resource' not login

Ok so after we create this scene we can explain the each role
- Resource owner: You
	- Resource owner is the one capable of granting access to a protected resource. It not necessery a person but in most of case it is person. in the scene you are the resource owner
- Resource server: Google
- 
- Client: Your browser
- Authorization server: 


## Reference
* [OAuth 2.0 and OpenID Connect (in plain English) - video](https://www.youtube.com/watch?v=996OiexHze0)
* [RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)
