---
title: So What Is OAuth? A Deep Dive into the OAuth Framework and How It Works
author:
  - Yorukot
publish_date: 2026-04-24
post_slug: so-what-is-oauth
featured: true
tags:
  - web
  - web-security
description: This post explains what OAuth is, why it exists, and how the OAuth 2.0 authorization code flow works.
lang: en
---

![OAuth 2.0 flow](./oauth-2.0-flow.png)

# Content
- [Why We Need OAuth](#why-we-need-oauth)
- [The Roles of OAuth 2.0](#the-roles-of-oauth-20)
  - [Resource Owner](#resource-owner)
  - [Resource Server](#resource-server)
  - [Client](#client)
  - [Authorization Server](#authorization-server)
- [Client Types](#client-types)
  - [Confidential Client](#confidential-client)
  - [Public Client](#public-client)
- [OAuth 2.0 Authorization Code Flow](#oauth-20-authorization-code-flow)
  - [0. Client Registration](#0.-client-registration)
  - [1. Initiate the Authorization Flow](#1.-initiate-the-authorization-flow)
  - [2. Authorization Endpoint](#2.-authorization-endpoint)
  - [3-6. User Authentication and Consent](#3-6.-user-authentication-and-consent)
  - [7. Redirect to Callback Endpoint](#7.-redirect-to-callback-endpoint)
  - [8. Access Token Request](#8.-access-token-request)
  - [9. Access Token Response](#9.-access-token-response)
  - [10-13. Protected Resource Access](#10-13.-protected-resource-access)
- [Summary](#summary)
- [References](#references)

# Why We Need OAuth

Before OAuth, if you wanted to access data from services like Google or Facebook, one ugly pattern was what some early apps, such as Yelp, did: ask users for their email and password directly, then log in on their behalf and scrape or fetch the data.

![Before OAuth](./before-oauth.png)

By today's standards, that approach is terrible. But it did exist, and even when companies said "don't do this," users usually did not care. They just wanted to import friends, contacts, or profile data as quickly as possible.

That was the context in which OAuth emerged. In 2006, the initial idea was proposed by Blaine Cook, who was then at Twitter. DeWitt Clinton from Google joined the discussion, and later Eran Hammer became heavily involved and had major influence on the early drafts.

After several rounds of discussion, OAuth 1.0 was published as RFC 5849 in April 2010, but [RFC 5849](https://datatracker.ietf.org/doc/html/rfc5849). is Informational rather than Standards Track. Two years later, after more developer feedback, OAuth 2.0 was published in October 2012 as [RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749). It was easier to implement and more practical at scale, so it spread very quickly, even though some security concerns remained.

Since OAuth 1.0 is now mostly historical, everything below refers to OAuth 2.0 unless I say otherwise.

OAuth 2.0 also became so widely used that many follow-up RFCs were later published to patch security gaps, define extensions, and make the ecosystem more usable in real-world scenarios. That is why the OAuth spec family now looks a bit like a maze.

![OAuth maze](./oauth-maze.png)

> Image source: [Lee McGovern, "OAuth 2.1: How Many RFCs Does it Take to Change a Lightbulb?"](https://developer.okta.com/blog/2019/12/13/oauth-2-1-how-many-rfcs)

As a side note, OAuth 2.1 is still being standardized. If you want to follow its progress, the best place to check is the IETF draft page for [draft-ietf-oauth-v2-1](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/).

# The Roles of OAuth 2.0

Before looking at the full flow, we first need to understand the roles defined by [Section 1.1 of RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-1.1).

To make this easier to explain, let's use a simple scenario. Imagine you have a Google account called `yorukot`, and you want to let Microsoft access `yorukot`'s Gmail data.

With that setup, the roles become much easier to see.

## Resource Owner

The resource owner is the party capable of granting access to a protected resource. Usually this is a person, though it does not have to be.

In our example, you are the resource owner.

## Resource Server

The resource server hosts the protected data. In this case, Google is holding your Gmail data.

The resource server protects that data and only serves it when the client presents a valid [access token](https://datatracker.ietf.org/doc/html/rfc6750).

## Client

The client is the application that wants to access your data. In this example, that is Microsoft.

Here, the word "client" does not mean the browser or the user's device. It means the application that wants to access the resource owner's data.

## Authorization Server

The authorization server is the component that authenticates the user, collects consent, and issues access tokens to the client.

One thing that often confuses people: the authorization server is not the same thing as the resource server. In many real systems they are the same backend, and they may even look like one product from the outside, but conceptually they are different roles.

If you want a simple mental model, think of them as two services:

- one service handles authorization
- one service serves protected resources

# Client Types

OAuth 2.0 defines two client types based on whether the client can authenticate securely with the authorization server.

## Confidential Client

A confidential client can authenticate securely with the authorization server. In practice, this usually means it can safely store a `client_secret`.

Most confidential clients have a backend server, which gives them a private place to store credentials and perform the token exchange.

This is also the most common client type, and it is the main one I focus on in this article.

## Public Client

A public client cannot authenticate securely with the authorization server. A mobile app or browser-based app is the classic example, because users can inspect the app and recover anything baked into it.

That does not mean the app is automatically insecure. It means you cannot trust it to keep long-term secrets like a `client_secret`.

To improve security for public clients, OAuth uses [RFC 7636 - PKCE (Proof Key for Code Exchange)](https://datatracker.ietf.org/doc/html/rfc7636). I won't cover PKCE in depth here, because it deserves its own article.

# OAuth 2.0 Authorization Code Flow

This article focuses on the OAuth 2.0 authorization code flow, which is defined in [Section 4.1 of RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1). There are other flows in OAuth 2.0, but this is the one you will see most often in modern systems.

![OAuth 2.0 flow](./oauth-2.0-flow.png)

> I also attatch the excalidraw file of the diagram here: [oauth-2.0-flow.excalidraw](./oauth-2.0-flow.excalidraw). You can open it with [Excalidraw](https://excalidraw.com/) and edit it as you like.

> Google and Microsoft appear in the diagram only to make the story easier to follow. They are just examples.

If you want to experiment while reading, the [OAuth 2.0 Playground](https://oauth.net/playground/) is a good companion tool.

## 0. Client Registration

Before any OAuth flow can start, the client must register with the authorization server. During registration, the authorization server assigns values such as `client_id`, `client_secret`, and allowed `redirect_uri` values.

| Parameter       | Description                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------- |
| `client_id`     | The identifier used to recognize the client.                                                      |
| `client_secret` | A secret used by confidential clients to authenticate themselves.                                 |
| `redirect_uri`  | One or more pre-registered callback URIs that the authorization server is allowed to redirect to. |

OAuth 2.0 itself describes client registration at a high level in [Section 2 of RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-2). There is also a separate specification for dynamic client registration: [RFC 7591](https://datatracker.ietf.org/doc/html/rfc7591).

## 1. Initiate the Authorization Flow

This is the point where the user tells the client, "I want to connect my account."

That might happen because the user clicks a button in the UI, submits a form, or triggers some other action. The RFC does not define this part. It simply assumes the client provides some way to start the flow.

## 2. Authorization Endpoint

At this step, the client redirects the user's browser to the authorization server's authorization endpoint.

The request usually looks like this:

```http
GET {authorization_endpoint}?
  response_type=code
  &client_id={client_id}
  &redirect_uri={redirect_uri}
  &scope={scope}
  &state={state}
```

Let's go through the important parameters.

### Response Type

The `response_type` tells the authorization server what the client wants back.

| Response Type              | Description                                                                                                                                                                                                   | RFC Reference                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `code`                     | Requests an authorization code.                                                                                                                                                                               | [Section 4.1 of RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1)     |
| `token`                    | Requests an access token directly via the implicit flow. The implicit grant is deprecated in [current best practice](https://datatracker.ietf.org/doc/html/rfc9700); new clients should generally not use it. | [Section 4.2.1 of RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-4.2.1) |
| registered extension value | Extensions can define additional response types.                                                                                                                                                              | [Section 8.4 of RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-8.4)     |

Reference: [Section 3.1.1 of RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-3.1.1)

### Client ID

The `client_id` comes from [client registration](#0.-client-registration). It tells the authorization server which client is making the request.

Reference: [Section 2.2 of RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-2.2)

### Redirect URI

The `redirect_uri` also comes from [client registration](#0.-client-registration). It tells the authorization server where to send the user after the authorization step is finished.

This must be controlled carefully. If an attacker can trick the authorization server into redirecting to a malicious URI, they may be able to steal authorization data.

OAuth 2.0 originally allowed some flexibility here, but current best practice is much stricter. [Section 2.1 of RFC 9700](https://datatracker.ietf.org/doc/html/rfc9700#section-2.1) recommends exact redirect URI matching.

Reference: [Section 3.1.2 of RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-3.1.2)

### Scope

The `scope` defines what the client is asking to do with the user's data.

Scopes are strings defined by the authorization server. For example, a client might want to read the user's avatar and email while also being able to edit the user's profile. In that case, the scope string might look something like this:

`user_avatar_read user_email_read user_profile_write`
And in the URI Parameter we plus + to repensent the space:

`user_avatar_read+user_email_read+user_profile_write`

Reference: [Section 3.3 of RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-3.3)

### State

The `state` value connects the original authorization request to the callback that comes back later in [Step 7](#7.-redirect-to-callback-endpoint).

The client should generate a fresh value, store it, and verify it when the user returns. If you skip this, you leave yourself open to CSRF-style attacks.

Reference: [Section 10.12 of RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-10.12)

## 3-6. User Authentication and Consent

Once the authorization server receives the authorization request, it needs to make sure two things are true:

- the user is really who they claim to be
- the user actually agrees to grant the requested access

So the authorization server typically shows pages that let the user:

- log in if they are not already authenticated
- review what app is requesting access
- review which scopes or resources are being requested
- approve or deny the request

After that, the authorization server knows both the user's identity and their consent decision.

Reference: [Sections 4.1.1 and 4.1.2 of RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.1)

## 7. Redirect to Callback Endpoint

If the user approves the request, the authorization server redirects the browser back to the client's callback endpoint.

For the authorization code flow, it looks like this:

```http
GET {redirect_uri}?
  code={code}
  &state={state}
```

The response can also contain an error instead of a code. I won't cover the error cases here, but they are defined in [Section 4.1.2.1 of RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1).

The `code` is a short-lived credential that the client can exchange for an access token. According to the RFC, its lifetime should be short and is typically around 10 minutes or less.

> If you do use PKCE in OAuth work flow, you can treat state as a optional parameter, because PKCE already provides strong CSRF protection. However, if you do not use PKCE, state is recommand. 

At this point, the client should verify the `state` value before doing anything else.

Reference: [Section 4.1.2 of RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2)

## 8. Access Token Request

After the client receives the callback, it sends the authorization code to the token endpoint.

This request is made server-to-server for confidential clients, and it is a `POST`, not a browser redirect.

```http
POST {token_endpoint}
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code={code}
&redirect_uri={redirect_uri}
&client_id={client_id}
&client_secret={client_secret}
```

| Parameter | Description |
| --- | --- |
| `grant_type` | Must be `authorization_code`. |
| `code` | The authorization code received in [Step 7](#7.-redirect-to-callback-endpoint). |
| `redirect_uri` | Must match the redirect URI used in the original authorization request. |
| `client_id` | The client identifier from [Step 0](#0.-client-registration). |
| `client_secret` | The client secret from [Step 0](#0.-client-registration), used by confidential clients. if the client already authication with authorization server it is a optional. |

#### client_secret_post and client_secret_basic
The above request is using `client_secret_post` authentication method, which means the client credentials are sent in the request body. There is also another method called `client_secret_basic`, where the client credentials are sent in the HTTP `Authorization` header using Basic authentication.

And the recommand authentication method is actually the client_secret_basic it is the MUST support for the authorization server.

For example:
```
Authorization: Basic czZCaGRSa3F0Mzo3RmpmcDBaQnIxS3REUmJuZlZkbUl3
```

One important note: `client_secret` is for confidential clients. Public clients do not rely on it, and modern public-client flows usually use PKCE instead.

Reference: [Section 4.1.3 of RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.3) [Section 2.3.1 of RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-2.3.1)

## 9. Access Token Response

If everything goes well, the authorization server returns an access token response.

```http
HTTP/1.1 200 OK
Content-Type: application/json;charset=UTF-8
Cache-Control: no-store
Pragma: no-cache

{
  "access_token": "2YotnFZFEjr1zCsicMWpAA",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA"
}
```

| Parameter       | Description                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------- |
| `access_token`  | The credential the client uses to call the resource server.                                        |
| `token_type`    | The token usage type, most commonly `Bearer`.                                                      |
| `expires_in`    | The token lifetime in seconds. For example, `3600` means one hour.                                 |
| `refresh_token` | Optional. A token used to obtain a new access token later without asking the user to re-authorize. |
| `scope`         | Optional. If present, this indicates the granted scope.                                            |

References:

- [Section 4.1.4 of RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.4)
- [Section 5.1 of RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-5.1)

## 10-13. Protected Resource Access

After the client has the access token, it can call the resource server.

For example, if the token type is `Bearer`, the client typically sends it in the HTTP `Authorization` header like this:

```http
Authorization: Bearer {access_token}
```

The exact API calls after that are application-specific, so OAuth 2.0 itself does not define every detail of the resource request.

One thing worth mentioning is token validation. In some architectures, the resource server validates tokens directly. In others, it asks the authorization server about the token through introspection. That is standardized in [RFC 7662 - OAuth 2.0 Token Introspection](https://datatracker.ietf.org/doc/html/rfc7662).

# PKCE (Proof Key for Code Exchange)

PKCE is a enhance of the OAuth code exchange. The original OAuth flow are susceptible to the authorization code interception attack. So we have PKCE to ehcnace it.

## The Original Flow Issue
![Original Token Exchange Flow](./original-token-exchange-flow.png)

You can see the original flow seems ok and we even have a `client_ecret` when we doing the exchange. what is the issue? so it is because we see it in the 

# Summary

OAuth is a complicated authorization framework. Even in this article, I've skipped a lot, especially topics like PKCE, OpenID Connect, token introspection details, and many of the newer security recommendations.

Still, the core idea is simple: do not hand your password to every third-party app that wants your data. Instead, let an authorization server issue limited tokens with limited scope.

That said, OAuth is complicated enough that people misuse it all the time. The most common example is using OAuth itself as if it were an authentication framework. OAuth is about authorization. If you want a standard layer for identity, that is usually where OpenID Connect (OIDC) comes in.

If you spot anything wrong in this article, email me at [hi@yorukot.me](mailto:hi@yorukot.me). I'll fix it as soon as I can.

## References

- [RFC 5849 - The OAuth 1.0 Protocol](https://datatracker.ietf.org/doc/html/rfc5849)
- [RFC 6749 - The OAuth 2.0 Authorization Framework](https://datatracker.ietf.org/doc/html/rfc6749)
- [RFC 6750 - The OAuth 2.0 Authorization Framework: Bearer Token Usage](https://datatracker.ietf.org/doc/html/rfc6750)
- [RFC 7591 - OAuth 2.0 Dynamic Client Registration Protocol](https://datatracker.ietf.org/doc/html/rfc7591)
- [RFC 7636 - Proof Key for Code Exchange by OAuth Public Clients](https://datatracker.ietf.org/doc/html/rfc7636)
- [RFC 7662 - OAuth 2.0 Token Introspection](https://datatracker.ietf.org/doc/html/rfc7662)
- [RFC 9700 - Best Current Practice for OAuth 2.0 Security](https://datatracker.ietf.org/doc/html/rfc9700)
- [OAuth Working Group Documents](https://datatracker.ietf.org/wg/oauth/documents/)
- [draft-ietf-oauth-v2-1 - The OAuth 2.1 Authorization Framework](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/)
