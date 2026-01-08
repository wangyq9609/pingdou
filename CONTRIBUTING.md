# 贡献指南

感谢你考虑为拼豆图片转图纸工具做出贡献！

## 开发流程

1. Fork本项目
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个Pull Request

## 代码规范

### TypeScript/JavaScript

- 使用TypeScript编写代码
- 遵循ESLint规则
- 使用有意义的变量和函数名
- 添加必要的类型注解
- 编写清晰的注释

### 提交信息

遵循约定式提交规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型（type）：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

示例：
```
feat(frontend): 添加图片批量处理功能

- 支持一次上传多张图片
- 批量转换为拼豆图纸
- 批量导出功能

Closes #123
```

## 测试

- 为新功能编写测试
- 确保所有测试通过
- 测试覆盖率不低于80%

```bash
# 运行测试
npm test

# 查看覆盖率
npm run test:coverage
```

## 文档

- 更新相关文档
- 添加必要的注释
- 更新API文档（如果涉及API变更）

## Pull Request检查清单

- [ ] 代码遵循项目规范
- [ ] 已添加必要的测试
- [ ] 测试全部通过
- [ ] 已更新相关文档
- [ ] commit信息清晰明确
- [ ] 没有合并冲突

## 需要帮助？

如有任何问题，请：
- 查看 [Issues](https://github.com/your-repo/issues)
- 提交新的Issue
- 联系维护者

再次感谢你的贡献！🎉
